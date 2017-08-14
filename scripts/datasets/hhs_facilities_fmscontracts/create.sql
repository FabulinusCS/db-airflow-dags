-- create table to load csv from the nyc open data portal
DROP TABLE IF EXISTS hhs_facilities_fmscontracts;
CREATE TABLE hhs_facilities_fmscontracts (
	Agency text,
	EIN text,
	LGL_NM text,
	EPIN text,
	Program_Name text,
	CT_Num text,
	Contract_Start_Date text,
	Contract_End_Date text,
	Value text,
	Function text,
	Level_1 text,
	Level_2 text,
	Level_3 text,
	Geography text,
	Language text,
	Population_Category text,
	Population2_PopulationName text,
	Population3_PopulationName text,
	CD text,
	Address text,
	City text,
	State text,
	Zip text,
	Population4_PopulationName text,
	Setting_Name text,
	Tag_Staff text,
	Tag_Date text,
	Selected text,
	Agency_Address text,
	Agency_Zip text,
	BRGH_CD text
)