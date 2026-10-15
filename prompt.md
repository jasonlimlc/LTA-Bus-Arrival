# Prompts History

This document records all the prompts provided during the development of the Singapore Bus Arrival & Live Fleet Tracker application.

---

### Prompt 1: Initial App Creation (Frontend)
```text
build a singapore based bus arrival time application that tracks real time bus locations and provides accurate wait time predictions for all LTA bus stops.

build just the front end for now, i will include the backend connection later.
```

---

### Prompt 2: Push to GitHub Repository
```text
git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/jasonlimlc/LTA-Bus-Arrival.git
```
*(GitHub token redacted for push protection)*

---

### Prompt 3: Serverless Backend Connection
```text
add a serverless connection that pulls live data from LTA Datamall using the following endpoints:

- store this in /api folder (project root level) not the src folder
- include /health.ts and /busarrival.ts within that subfolder
- do NOT hardcode any key, I will include them manually

GET 
https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
# AccountKey: <LTA_ACCOUNT_KEY>
# accept: application/json
```

---

### Prompt 4: Gather Prompts History
```text
gather all the prompts that have written thus far and store them into prompt.md
```
