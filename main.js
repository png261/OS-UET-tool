function parseProcesses(input) {
    const fullPattern = /(\w+)\((\d+),\s*(\d+)\)/g;
    const missingArrivalTimePattern = /(\w+)\((\d+)\)/g;

    let processes = [];
    let match;
    let hasFullMatches = false;

    // First, check for full matches (arrival_time, duration)
    while ((match = fullPattern.exec(input)) !== null) {
        hasFullMatches = true;
        processes.push({
            process_name: match[1],
            arrival_time: Number(match[2]),
            duration: Number(match[3])
        });
    }

    // If no full matches were found, check for missing arrival time cases
    if (!hasFullMatches) {
        while ((match = missingArrivalTimePattern.exec(input)) !== null) {
            processes.push({
                process_name: match[1],
                arrival_time: 0,
                duration: Number(match[2])
            });
        }
    }

    return processes;
}

// Calculate throughput (number of completed processes per unit time)
function calculateThroughput(schedulingResult) {
    if (schedulingResult.length === 0) return 0;

    let totalTime = schedulingResult[schedulingResult.length - 1].end;
    return schedulingResult.length / totalTime;
}

// Calculate turnaround time for each process
function calculateTurnaroundTime(schedulingResult, processes) {
    let turnaroundTimes = {};

    for (const process of processes) {
        let completionTime = schedulingResult.find(p => p.process_name === process.process_name).end;
        turnaroundTimes[process.process_name] = completionTime - process.arrival_time;
    }

    return turnaroundTimes;
}

// Calculate response time for each process
function calculateResponseTime(schedulingResult, processes) {
    let responseTimes = {};

    for (const process of processes) {
        let startTime = schedulingResult.find(p => p.process_name === process.process_name).start;
        responseTimes[process.process_name] = startTime - process.arrival_time;
    }

    return responseTimes;
}

// Calculate waiting time for each process
function calculateWaitingTime(schedulingResult, processes) {
    let waitingTimes = {};

    for (const process of processes) {
        let turnaroundTime = calculateTurnaroundTime(schedulingResult, processes)[process.process_name];
        waitingTimes[process.process_name] = turnaroundTime - process.duration;
    }

    return waitingTimes;
}


// Scheduling algorithm - First-Come, First-Served (FCFS)
function FCFS(processes) {
    let currentTime = 0;
    let schedulingResult = [];

    for (const process of processes) {
        let startTime = Math.max(currentTime, process.arrival_time);
        let endTime = startTime + process.duration;

        schedulingResult.push({
            process_name: process.process_name,
            start: startTime,
            end: endTime
        });

        currentTime = endTime;
    }

    return schedulingResult;
}

function STF(processes) {
    processes.sort((a, b) => a.arrival_time - b.arrival_time || a.duration - b.duration);

    let currentTime = 0;
    let schedulingResult = [];

    while (processes.length > 0) {
        let availableProcesses = processes.filter(p => p.arrival_time <= currentTime);
        
        if (availableProcesses.length === 0) {
            currentTime = processes[0].arrival_time;
            availableProcesses = [processes[0]];
        }

        availableProcesses.sort((a, b) => a.duration - b.duration);
        let process = availableProcesses[0];

        let start = currentTime;
        let end = start + process.duration;

        schedulingResult.push({ process_name: process.process_name, start, end });

        currentTime = end;
        processes = processes.filter(p => p !== process);
    }

    return schedulingResult;
}

function SRTF(processes) {
    let currentTime = 0;
    let schedulingResult = [];
    let remainingProcesses = processes.map(p => ({ ...p, remaining_time: p.duration }));
    
    while (remainingProcesses.length > 0) {
        let availableProcesses = remainingProcesses.filter(p => p.arrival_time <= currentTime);
        
        if (availableProcesses.length === 0) {
            currentTime = remainingProcesses[0].arrival_time;
            continue;
        }

        availableProcesses.sort((a, b) => a.remaining_time - b.remaining_time);
        let process = availableProcesses[0];

        let start = currentTime;
        currentTime++;
        process.remaining_time--;

        if (schedulingResult.length === 0 || schedulingResult[schedulingResult.length - 1].process_name !== process.process_name) {
            schedulingResult.push({ process_name: process.process_name, start, end: start + 1 });
        } else {
            schedulingResult[schedulingResult.length - 1].end = start + 1;
        }

        if (process.remaining_time === 0) {
            remainingProcesses = remainingProcesses.filter(p => p !== process);
        }
    }

    return schedulingResult;
}

function round_robin(processes, time_quantum) {
    let queue = [...processes];
    let currentTime = 0;
    let schedulingResult = [];

    while (queue.length > 0) {
        let process = queue.shift();

        let start = Math.max(currentTime, process.arrival_time);
        let executionTime = Math.min(process.duration, time_quantum);
        let end = start + executionTime;

        schedulingResult.push({ process_name: process.process_name, start, end });

        process.duration -= executionTime;
        currentTime = end;

        if (process.duration > 0) {
            queue.push(process);
        }
    }

    return schedulingResult;
}

function runScheduler() {
    const input = document.getElementById("processInput").value;
    const algorithm = document.getElementById("algorithm").value;
    const quantum = Number(document.getElementById("quantum").value);
    let processes = parseProcesses(input);
    let result;

    switch (algorithm) {
        case "FCFS":
            result = FCFS(processes);
            break;
        case "STF":
            result = STF(processes);
            break;
        case "SRTF":
            result = SRTF(processes);
            break;
        case "ROUND_ROBIN":
            result = round_robin(processes, quantum);
            break;
        default:
            alert("Algorithm not implemented yet!");
            return;
    }
    displayResults(result);
    displayMetrics(result, processes);
}

function displayResults(schedulingResult) {
    const resultsTable = document.getElementById("resultsTable").getElementsByTagName('tbody')[0];
    resultsTable.innerHTML = "";
    schedulingResult.forEach(p => {
        let row = resultsTable.insertRow();
        row.insertCell(0).innerText = p.process_name;
        row.insertCell(1).innerText = p.start;
        row.insertCell(2).innerText = p.end;
    });
}

function displayMetrics(schedulingResult, processes) {
    document.getElementById("throughput").innerText = calculateThroughput(schedulingResult, processes);
    document.getElementById("turnaround").innerText = calculateThroughput(schedulingResult, processes);
    document.getElementById("response").innerText = calculateThroughput(schedulingResult, processes);
    document.getElementById("waiting").innerText = calculateThroughput(schedulingResult, processes);
}

