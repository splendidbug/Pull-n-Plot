# React + Flask webapp to fetch data and perform analytics
Data is fetched from multiple sources, filtered and analytics is performed.


## Task Creation Page
![Alt text](https://github.com/splendidbug/Pull-n-Plot/blob/main/images/Screenshot%202025-04-03%20032857.png)

User can create a task by selecting the data sources and apply pre filters.


## Task Status Page
![Alt text](https://github.com/splendidbug/Pull-n-Plot/blob/main/images/Screenshot%202025-04-03%20032933.png)

The task will be added to a queue where sequentially tasks will be processed.


## Analytics Page
![Alt text](https://github.com/splendidbug/Pull-n-Plot/blob/main/images/Screenshot%202025-04-03%20033004.png)

Once a task is completed, users can perform analytics where the user can select fields to disaply, add filters. 

The charts are dynamically updated when new filters are added. Users can also download the chart. 

Currently there are 3 types of charts: line, bar, pie.

### Tech Stack:
Frontend - React

Backend - Flask

Database - SQLite

Chart creation - D3 js
