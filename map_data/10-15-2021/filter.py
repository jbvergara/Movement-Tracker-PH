import csv
from datetime import date


def filter_raw_data(filename):
    with open(filename, 'r', newline='') as csv_file:
        row1 = csv.reader(csv_file, delimiter='\t')
        fieldnames = next(row1)
        table = csv.DictReader(csv_file, fieldnames = fieldnames, delimiter='\t')
        listoflists = []
        for row in table:
            if row['country'] == 'PHL':
                buff = []
                for field in fieldnames:
                    if(field in ['ds', 'polygon_name', 'all_day_bing_tiles_visited_relative_change', 'all_day_ratio_single_tile_users']):
                        buff.append(row[field])
                    
                listoflists.append(buff)
                print("FILTER-PH:", buff)

    with open('raw_data_filtered.csv', 'w') as gen_csv:
        writer = csv.writer(gen_csv)
        writer.writerow(['ds', 'polygon_name', 'all_day_bing_tiles_visited_relative_change', 'all_day_ratio_single_tile_users'])
        for item in listoflists:
            writer.writerow(item)
            
def merge_longlat(filename):
    with open(filename, 'r', newline='') as fb_data_file:
        fb_row1 = csv.reader(fb_data_file)
        fb_fieldnames = next(fb_row1)
        fb_table = csv.DictReader(fb_data_file, fieldnames = fb_fieldnames)
        listoflists = []
        buff_place = ''
        buff_missing = []
        
        for fb_row in fb_table:
            buff = []
            fb_place = fb_row['polygon_name']
            for field in fb_fieldnames:
                buff.append(fb_row[field])
                    
            if(fb_place != buff_place):
                [latitude, longitude] = search_longlat(fb_place)
                if(latitude=='' and longitude==''):
                    buff_missing.append([fb_place])
                buff.append(latitude)
                buff.append(longitude)
                buff_place = fb_place
            else:
                buff.append(latitude)
                buff.append(longitude)
                
            listoflists.append(buff)
            print("MERGED:", buff)

    with open('merged_data.csv', 'w') as gen_csv:
        writer = csv.writer(gen_csv)
        writer.writerow(fb_fieldnames + ['latitude', 'longitude'])
        for item in listoflists:
            writer.writerow(item)
    
    with open('missing_place.csv', 'w') as gen_csv:
        writer = csv.writer(gen_csv)
        for item in buff_missing:
            writer.writerow(item)
            print("MISSING:",item)
            
def search_longlat(place_name):
    with open('PH_long_lat_filtered.csv', 'r', newline='') as long_lat_file:
        long_lat_row1 = csv.reader(long_lat_file)
        long_lat_fieldnames = next(long_lat_row1)
        long_lat_table = csv.DictReader(long_lat_file, fieldnames = long_lat_fieldnames)
        
        for long_lat_row in long_lat_table:
            latitude = ''
            longitude = ''
            if(long_lat_row['name'] == place_name):
                latitude = long_lat_row['latitude']
                longitude = long_lat_row['longitude']
                break

        return [latitude, longitude]
    
            
def clean_data(filename):
    with open(filename, 'r', newline='') as csv_file:
        row1 = csv.reader(csv_file)
        fieldnames = next(row1)
        table = csv.DictReader(csv_file, fieldnames = fieldnames)
        listoflists = []
        for row in table:
            buff = []
            for field in fieldnames:
                if(field == 'ds'):
                    buff.append(date.fromisoformat(row['ds']).strftime('%s') + "000")
                buff.append(row[field])
            listoflists.append(buff)
            print("FINAL:", buff)
    
    with open('clean_merged_data.csv', 'w') as gen_csv:
        writer = csv.writer(gen_csv)
        writer.writerow(['epoch'] + fieldnames)
        for item in listoflists:
            writer.writerow(item)


if __name__ == '__main__':
    #filter_raw_data('raw_data.txt')
    merge_longlat('raw_data_filtered.csv')
    clean_data('merged_data.csv')