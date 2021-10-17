import csv

user_input = input("Please enter CSV filename: ")
filename = user_input + '.csv'

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
            print("ROW:", buff)

with open(user_input + '_filtered.csv', 'w') as gen_csv:
    writer = csv.writer(gen_csv)
    writer.writerow(fieldnames)
    for item in listoflists:
        writer.writerow(item)
