import csv
from datetime import date


filename = 'merged_data.csv'

with open(filename, 'r', newline='') as csv_file:
    row1 = csv.reader(csv_file)
    fieldnames = next(row1)
    table = csv.DictReader(csv_file, fieldnames = fieldnames)
    listoflists = []
    for row in table:
        buff = []
        for field in fieldnames:
            if(field == 'time'):
                buff.append(date.fromisoformat(row['time']).strftime('%s') + "000")
            buff.append(row[field])
        listoflists.append(buff)
        print("ROW:", buff)

with open('clean_merged_data.csv', 'w') as gen_csv:
    writer = csv.writer(gen_csv)
    writer.writerow(fieldnames)
    for item in listoflists:
        writer.writerow(item)