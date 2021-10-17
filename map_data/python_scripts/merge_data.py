import csv

#user_input = input("Please enter fb_data filename: ")
#fb_data = user_input + '.csv'
#user_input = input("Please enter PH_long_lat filename: ")
#long_lat = user_input + '.csv'
fb_data = "fb_data_filtered.csv"
long_lat = "PH_long_lat_filtered.csv"

with open(fb_data, 'r', newline='') as fb_data_file:
    fb_row1 = csv.reader(fb_data_file)
    fb_fieldnames = next(fb_row1)
    fb_table = csv.DictReader(fb_data_file, fieldnames = fb_fieldnames)
    listoflists = []
        
    for fb_row in fb_table:
        buff = []
        fb_place = fb_row['polygon_name']
        for field in fb_fieldnames:
            buff.append(fb_row[field])
                
        with open(long_lat, 'r', newline='') as long_lat_file:
            long_lat_row1 = csv.reader(long_lat_file)
            long_lat_fieldnames = next(long_lat_row1)
            long_lat_table = csv.DictReader(long_lat_file, fieldnames = long_lat_fieldnames)
            
            for long_lat_row in long_lat_table:
                if(long_lat_row['name'] == fb_place):
                    buff.append(long_lat_row['latitude'])
                    buff.append(long_lat_row['longitude'])
                    break
            
        listoflists.append(buff)
        print("ROW:", buff)

with open('merged_data.csv', 'w') as gen_csv:
    writer = csv.writer(gen_csv)
    writer.writerow(fb_fieldnames)
    for item in listoflists:
        writer.writerow(item)
