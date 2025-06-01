const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process'); // To start Python server
const fs = require('fs'); // To check if file exists
let pythonProcess; // Global variable to hold the Python process

let mainWindow;
let flwWindow;
let predictionWindow;
let isMainWindowMaximized = false; // Track if the main window is maximized

// Function to create Main-Window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 1100,
        webPreferences: {
            preload: path.join(__dirname, 'Main-Window', 'preload.js'),
            contextIsolation: true,
            sandbox: true,  // Ensures that renderer processes run in a separate sandboxed environment
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    // Check if the main window is maximized
    mainWindow.on('maximize', () => {
        isMainWindowMaximized = true;
    });
    
    mainWindow.on('unmaximize', () => {
        isMainWindowMaximized = false;
    });

    mainWindow.loadFile(path.join(__dirname, 'Main-Window', 'index.html'));
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    console.log("Main-Window Created");
}

// Function to start the Python server
function startPythonServer() {
    const scriptPathExe = 'D:\\Reflow Oven Desktop App\\python_backend\\server.exe';
    const scriptPathPy = 'D:\\Reflow Oven Desktop App\\python_backend\\server.py';

    try {
        if (process.platform === 'win32' && fs.existsSync(scriptPathExe)) {
            // Spawn the .exe if available (production)
            pythonProcess = spawn(scriptPathExe);
            console.log(`Started Python server as .exe: ${scriptPathExe}`);
        } else {
            // For non-Windows platforms or development, use python3
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
            pythonProcess = spawn(pythonCommand, [scriptPathPy]);
            console.log(`Started Python server using ${pythonCommand} for .py: ${scriptPathPy}`);
        }

        // Log Python server output (stdout)
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python server output: ${data}`);
        });

        // Log Python server errors (stderr)
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python server error: ${data}`);
        });

        // When Python server closes
        pythonProcess.on('close', (code) => {
            console.log(`Python server exited with code ${code}`);
        });
    } catch (err) {
        console.error('Failed to start Python server:', err);
    }
}

// Function to stop the Python server
function stopPythonServer() {
    if (pythonProcess) {
        pythonProcess.kill(); // Kill the Python server when app closes
        console.log("Python server stopped");
    }
}

// Function to create Flw-Window
function createFlwWindow(inputData) {
    console.log("Creating Flw-Window with data:", inputData); // For Debugging
    flwWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'Flw-Window', 'flw-preload.js'),
            contextIsolation: true,
            sandbox: true,  // Ensures that renderer processes run in a separate sandboxed environment
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    // Load the flw.html file
    flwWindow.loadFile(path.join(__dirname, 'Flw-Window', 'flw.html'))
        .then(() => {
            console.log("Flw-Window Loaded");
            flwWindow.webContents.send('init-data', inputData);
        })
        .catch((err) => {
            console.error("Failed to load Flw-Window:", err);
        });

    // If the main window is maximized, maximize the Flw window as well
    if (isMainWindowMaximized) {
        flwWindow.maximize();
    }

    flwWindow.on('closed', () => {
        flwWindow = null;
    });
}

// Function to create Prediction-Window
function createPredictionWindow(predictionsData) {
    predictionWindow = new BrowserWindow({
        width: 1100,
        height: 350,
        webPreferences: {
            preload: path.join(__dirname, 'Prediction-Window', 'prediction-preload.js'),
            contextIsolation: true,
            sandbox: true,  // Ensures that renderer processes run in a separate sandboxed environment
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    // Load the prediction window
    predictionWindow.loadFile(path.join(__dirname, 'Prediction-Window', 'prediction.html'));

    // Send the prediction data to the prediction window after it loads
    predictionWindow.webContents.on('did-finish-load', () => {
        console.log('Sending predictions to Prediction-Window:', predictionsData);
        predictionWindow.webContents.send('show-predictions', predictionsData);
    });

    predictionWindow.on('closed', () => {
        predictionWindow = null;
    });
}

// ** New Feature - Handle Opening PCB Data Excel File and Triggering Find and Replace **
ipcMain.on('open-excel-file', () => {
    const filePath = path.join(__dirname, 'PCB_Data.xlsx');
    const pythonScript = path.join(__dirname, 'open_excel_find_replace.py');  // Path to Python script

    // Check if the Excel file exists
    if (fs.existsSync(filePath)) {
        // Run the Python script
        const pythonProcess = spawn('python', [pythonScript]);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python output: ${data.toString()}`);  // Log Python output
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python error: ${data.toString()}`);  // Log Python error
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
        });
    } else {
        console.error('Excel file not found:', filePath);
    }
});

// Handle the IPC event to open the Flw-Window
ipcMain.on('open-flw-window', (event, inputData) => {
    console.log('Received data from Main-Window:', inputData);
    createFlwWindow(inputData);

    // Close the main window after opening Flw-Window
    if (mainWindow) {
        mainWindow.close();
    }
});

// Handle the IPC event to open the Prediction-Window
ipcMain.on('open-prediction-window', (event, predictionsData) => {
    console.log('Received predictions data for Prediction-Window:', predictionsData);
    createPredictionWindow(predictionsData);
});

// Handle the IPC event to reopen the Main-Window (for the "Back" button)
ipcMain.on('open-main-window', () => {
    console.log('Back button clicked, reopening Main-Window');
    createMainWindow(); // Recreate the Main-Window

    // Close the Flw-Window after reopening Main-Window
    if (flwWindow) {
        flwWindow.close();
    }
});

// When Electron is ready, create the Main-Window and start Python server
app.whenReady().then(() => {
    createMainWindow();  // Create the main window
    startPythonServer(); // Start the Python backend server
});

// Handle macOS behavior
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopPythonServer(); // Stop the Python server when all windows are closed
        app.quit();
    }
});

// Ensure Python server stops when Electron quits
app.on('before-quit', () => {
    stopPythonServer();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
