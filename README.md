Movement Tracker PH

The goal of this project is to map the proportion of population that stayed within their city/municipality in the Philippines.

Tools:
1. React
2. Tailwind CSS
3. ArcGIS Javascript Library
4. Python

The map_data folder contains the raw data and Python scripts used to process the raw_data from Facebook (https://data.humdata.org/dataset/movement-range-maps).
1. raw_data - raw data released by Facebook.
2. raw_data_filtered - Filtered raw data to show entries for the Philippines
3. merged_data - Merged the longitude and latitude data to the filtered raw data
4. clean_merged_data - added epoch date format for ArcGIS
5. PH_long_lat_filtered - longitude and latitude data