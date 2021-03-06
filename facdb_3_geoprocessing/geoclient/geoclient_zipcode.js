/////////////////////////////////////////////////////////////////////////////////////////////////////////
// PROCESS OVERVIEW
/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Select all records with null geoms and zipcode value
// Geocode using zipcode and address -- prints errors and and skips to keep going

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 1 --- LOADING DEPENDENCIES
/////////////////////////////////////////////////////////////////////////////////////////////////////////


// REQUIRE CODE LIBRARY DEPENDENCIES
var pgp = require('pg-promise')(),
  request = require('request'),
  Mustache = require('mustache');

var argv = require('minimist')(process.argv.slice(2));

var db = pgp({
  database: argv.db,
  user: argv.db_user,
  password: argv.db_pass
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 2 --- DEFINING THE QUERY USED TO FIND NULL GEOMETRIES
/////////////////////////////////////////////////////////////////////////////////////////////////////////


// querying for records without geoms
var nullGeomQuery = `SELECT DISTINCT
                      zipcode,
                      addressnum,
                      streetname
                    FROM
                      facilities
                    WHERE
                      addressnum IS NOT NULL
                      AND streetname IS NOT NULL
                      AND zipcode IS NOT NULL
                      AND processingflag IS NULL`;


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 3 --- APPLYING THE nullGeomQuery IN THE DATABASE TO FIND RECORDS WITH NULL GEOM
/////////////////////////////////////////////////////////////////////////////////////////////////////////


var i=0;
var nullGeomResults;

db.any(nullGeomQuery)
  .then(function (data) {
    nullGeomResults = data

    console.log('Found ' + nullGeomResults.length + ' null geometries in facilities ')
    addressLookup1(nullGeomResults[i]);
  })
  .catch(function(err) {
    console.log(err)
  })


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 4 --- SETTING TEMPLATES FOR REQUEST TO API -- REQUIRES ADDRESS#, STREET NAME, AND BOROUGH OR ZIP
/////////////////////////////////////////////////////////////////////////////////////////////////////////


// records without geoms and with zipcode, not boro
var geoclientTemplate1 = 'https://api.cityofnewyork.us/geoclient/v1/address.json?houseNumber={{housenumber}}&street={{{streetname}}}&zip={{zipcode}}&app_id={{app_id}}&app_key={{app_key}}';


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 5 --- DEFINES/RUNS FUNCTION WHICH LOOKS UP ADDRESSES USING geoclientTemplate
/////////////////////////////////////////////////////////////////////////////////////////////////////////


function addressLookup1(row) {
  // console.log('Looking up address', row.zipcode, row.addressnum.trim(), row.streetname.split(',')[0].split('#')[0].split(' - ')[0].trim())

      var apiCall1 = Mustache.render(geoclientTemplate1, {

        // MAKE SURE THESE MATCH THE FIELD NAMES
        housenumber: row.addressnum.replace("/", "").replace("\"", "").replace("!", "").trim(),
        streetname: row.streetname.split(',')[0].split('#')[0].split(' - ')[0].trim(),
        zipcode: row.zipcode,
        app_id: argv.geoclient_id,
        app_key: argv.geoclient_key
      })

      // console.log(apiCall1);

      request(apiCall1, function(err, response, body) {
          console.log(err)
          // A. try PARSING json
          try {
            var data = JSON.parse(body)
            // B. try getting ADDRESS from data response
            try {
              data = data.address;
              // C. try UPDATING facilities with the address from data
              try {
                updateFacilities(data, row)
              // C. catch error when UPDATING facilities table
              } catch (e) {
                console.log(data)
                i++;
                console.log(i,nullGeomResults.length)
                  if (i<nullGeomResults.length) {
                    addressLookup1(nullGeomResults[i])
                  }
              }
            // B. catch error with getting ADDRESS from data response
            } catch (e) {
              i++;
              console.log(i,nullGeomResults.length)
              if (i<nullGeomResults.length) {
                addressLookup1(nullGeomResults[i])
              }
            }
          // A. catch error with PARSING json
          } catch (e) {
            i++;
            console.log(i,nullGeomResults.length)
            if (i<nullGeomResults.length) {
              addressLookup1(nullGeomResults[i])
            }
          }
      })
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 6 --- DEFINES/RUNS FUNCTION updateFacilities
/////////////////////////////////////////////////////////////////////////////////////////////////////////


function updateFacilities(data, row) {

  var insertTemplate = `UPDATE
                          facilities
                        SET
                          geom=(CASE
                            WHEN geom IS NULL THEN ST_SetSRID(ST_GeomFromText(\'POINT({{longitude}} {{latitude}})\'),4326)
                            ELSE geom
                          END),
                          latitude=(CASE
                            WHEN geom IS NULL THEN \'{{latitude}}\'
                            ELSE latitude
                          END),
                          longitude=(CASE
                            WHEN geom IS NULL THEN \'{{longitude}}\'
                            ELSE longitude
                          END),
                          addressnum=\'{{newaddressnum}}\',
                          streetname=initcap(\'{{newstreetname}}\'),
                          address=CONCAT(\'{{newaddressnum}}\',\' \',initcap(\'{{newstreetname}}\')),
                          bbl=ARRAY[\'{{bbl}}\'],
                          bin=ARRAY[\'{{bin}}\'],
                          boro=initcap(\'{{boro}}\'),
                          borocode=(CASE
                            WHEN \'{{boro}}\'=\'MANHATTAN\' THEN 1
                            WHEN \'{{boro}}\'=\'BRONX\' THEN 2
                            WHEN \'{{boro}}\'=\'BROOKLYN\' THEN 3
                            WHEN \'{{boro}}\'=\'QUEENS\' THEN 4
                            WHEN \'{{boro}}\'=\'STATEN ISLAND\' THEN 5
                          END),
                          city=initcap(\'{{city}}\'),
                          processingflag=(CASE
                            WHEN geom IS NULL THEN \'geoclientzip2geom\'
                            ELSE \'geoclientzip\'
                          END)
                        WHERE
                          addressnum=\'{{oldaddressnum}}\'
                          AND streetname=\'{{oldstreetname}}\'
                          AND zipcode=\'{{zipcode}}\'
                          AND processingflag IS NULL`;

  if(data.latitude && data.longitude) {
    // console.log('Updating facilities');

    var insert = Mustache.render(insertTemplate, {

      // data. comes from api response
      latitude: data.latitude,
      longitude: data.longitude,
      xcoord: data.xCoordinate,
      ycoord: data.yCoordinate,
      bbl: data.bbl,
      bin: data.buildingIdentificationNumber,
      borocode: data.bblBoroughCode,
      boro: data.firstBoroughName,
      zipcode: data.zipCode,
      city: data.uspsPreferredCityName,
      newaddressnum: data.houseNumber,
      newstreetname: data.boePreferredStreetName,

      // row. comes from original table row from psql query
      oldaddressnum: row.addressnum,
      oldstreetname: row.streetname
    })

    // console.log(insert);


    db.none(insert)
    .then(function(data) {
      i++;
      console.log(i,nullGeomResults.length)
      if (i<nullGeomResults.length) {
         addressLookup1(nullGeomResults[i])
      } else {
        console.log('Done!')
      }

    })
    .catch(function(err) {
      console.log('ERROR from insert: ', err)
      console.log(insert);
    })

  } else {
    // console.log('Response did not include a lat/lon, skipping...');
    i++;
        console.log(i,nullGeomResults.length)
        if (i<nullGeomResults.length) {
           addressLookup1(nullGeomResults[i])
        }
  }
}
