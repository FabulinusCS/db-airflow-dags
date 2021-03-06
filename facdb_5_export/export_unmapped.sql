COPY (

	WITH inside AS (
	SELECT
		facilities.uid
	FROM
		facilities,
		dcp_boroboundaries_wi
	WHERE
		facilities.geom IS NOT NULL
		AND ST_Intersects (facilities.geom, dcp_boroboundaries_wi.geom)
	)

	SELECT
		facilities.uid,
		-- facilities.hash,
		facilities.idold,
		array_to_string(facilities.idagency,';') AS idagency,
		facilities.facname,
		facilities.addressnum,
		facilities.streetname,
		facilities.address,
		facilities.city,
		facilities.boro,
		facilities.borocode,
		facilities.zipcode,
		facilities.latitude,
		facilities.longitude,
		facilities.xcoord,
		facilities.ycoord,
		array_to_string(facilities.bin,';') AS bin,
		array_to_string(facilities.bbl,';') AS bbl,
		facilities.cd,
		facilities.council,
		facilities.censtract,
		facilities.nta,
		facilities.facdomain,
		facilities.facgroup,
		facilities.facsubgrp,
		facilities.factype,
		array_to_string(facilities.capacity,';') AS capacity,
		array_to_string(facilities.util,';') AS util,
		array_to_string(facilities.captype,';') AS captype,
		array_to_string(facilities.utilrate,';') AS utilrate,
		array_to_string(facilities.area,';') AS area,
		array_to_string(facilities.areatype,';') AS areatype,
		facilities.proptype,
		facilities.optype,
		facilities.opname,
		facilities.opabbrev,
		array_to_string(facilities.overlevel,';') AS overlevel,
		-- array_to_string(facilities.overtype,';') AS overtype,
		array_to_string(facilities.overagency,';') AS overagency,
		array_to_string(facilities.overabbrev,';') AS overabbrev,
		array_to_string(facilities.datasource,';') AS datasource,
		array_to_string(facilities.dataname,';') AS dataname,
		array_to_string(facilities.dataurl,';') AS dataurl,
		array_to_string(facilities.datadate,';') AS datadate,
		-- facilities.processingflag,
		-- facilities.agencyclass1,
		-- facilities.agencyclass2,
		-- facilities.colpusetype,
		-- facilities.dateactive,
		-- facilities.dateinactive,
		-- facilities.inactivestatus,
		-- array_to_string(facilities.tags,';'),
		-- facilities.notes,
		-- array_to_string(facilities.datesourcereceived,';'),
		-- facilities.datecreated,
		-- facilities.dateedited,
		-- facilities.creator,
		-- facilities.editor,
		-- array_to_string(facilities.datadownload,';'),
		-- array_to_string(facilities.datatype,';'),
		-- array_to_string(facilities.refreshmeans,';'),
		-- array_to_string(facilities.refreshfrequency,';'),
		array_to_string(facilities.pgtable,';') AS pgtable,
		array_to_string(facilities.uid_merged,';') AS uid_merged,
		-- array_to_string(facilities.hash_merged,';') AS hash_merged,
		-- facilities.buildingid,
		-- facilities.buildingname,
		-- facilities.schoolorganizationlevel,
		-- facilities.children,
		-- facilities.youth,
		-- facilities.senior,
		-- facilities.family,
		-- facilities.disabilities,
		-- facilities.dropouts,
		-- facilities.unemployed,
		-- facilities.homeless,
		-- facilities.immigrants,
		-- facilities.groupquarters,
		facilities.geom
	FROM
		facilities
	WHERE
		facilities.uid NOT IN (SELECT uid FROM inside)
	ORDER BY
		-- domain, facilitygroup, facilitysubgroup, facilitytype
		RANDOM()
) TO '{{ params.export_dir }}/facdb_facilities_unmapped.csv' WITH CSV DELIMITER ',' HEADER;
