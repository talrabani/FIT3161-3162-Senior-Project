import numpy as np
import csv

# with open('c:/Users/afs02/Documents/fit3161/FIT3161-3162-Senior-Project/Scraper/stations.txt') as f:
#     lines = f.readlines()
#     stations = [lines[i][0:7].split()+[lines[i][14:58].strip()]+lines[i][58:89].split() for i in range(len(lines))]
#     new_st = [lines[2].split()[0:1]+lines[2][13:89].split()]+stations[4:-6]

# np.savetxt("c:/Users/afs02/Documents/fit3161/FIT3161-3162-Senior-Project/Scraper/stations.csv", new_st, delimiter=", ", fmt="% s")

# with open('c:/Users/afs02/Documents/fit3161/FIT3161-3162-Senior-Project/Scraper/stations.csv') as f:
#     lines = f.readlines()
#     # print(lines[2].split()[1])
#     new_st = []
#     for i in lines:
#         line = i.split(sep=",")
#         new_st.append([line[1][0:5],line[-2].strip(),line[-1].strip()])
#     new_st[0][0] = "title"
# np.savetxt("c:/Users/afs02/Documents/fit3161/FIT3161-3162-Senior-Project/Scraper/tileset-stations.csv", new_st, delimiter=", ", fmt="% s")

# with open('c:/Users/afs02/Documents/fit3161/FIT3161-3162-Senior-Project/Scraper/temp-stations.txt') as f:
#     lines = f.readlines()
#     # print(lines[4][0:7].split()+[lines[4][8:49].strip()]+lines[4][49:67].split())
#     # stations = [lines[i][0:7].split()+[lines[i][8:49].strip()]+lines[i][49:67].split() for i in range(len(lines))]
#     stations = [[lines[i][8:49].strip()]+lines[i][49:67].split() for i in range(len(lines))]
#     new_st = [lines[2][7:67].split()]+stations[4:-6]
# # for i in new_st:
# #     if (len(i) != len(new_st[0])):
# #         print(i)
# np.savetxt("c:/Users/afs02/Documents/fit3161/FIT3161-3162-Senior-Project/Scraper/temp-stations.csv", new_st, delimiter=", ", fmt="% s")


# with open('c:/Users/afs02/Documents/fit3161/FIT3161-3162-Senior-Project/Scraper/SA4_2016_AUST.csv') as f:
#     lines = csv.reader(f,delimiter=",")
#     sa4_list = list(lines)
#     # print(len(sa4_list))
#     for i in sa4_list[1::]:
#         if (i[-1] == '0'):
#             sa4_list.remove(i)

# np.savetxt("c:/Users/afs02/Documents/fit3161/FIT3161-3162-Senior-Project/Scraper/SA4-Trim.csv", sa4_list, delimiter=", ", fmt="% s")