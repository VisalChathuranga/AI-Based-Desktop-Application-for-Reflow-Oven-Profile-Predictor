// Store the data received from Main-Window
let mainWindowData = {};

// Listen for the data from the Main-Window through the exposed API
window.electronAPI.receive('init-data', (inputData) => {
    mainWindowData = inputData;  // Store the main window data for later use
    console.log('Main window data received:', mainWindowData);  // Log received data for debugging
});

// Helper function to validate if the input is a number
function isNumeric(value) {
    return !isNaN(value) && value.trim() !== '';
}

// Set focus to T1 on window load
window.onload = () => {
    document.getElementById('t1').focus();  // Automatically set the cursor to T1 input field
};

// Function to move to the next input field on "Enter" press
function handleKeyPress(event, nextElementId) {
    if (event.key === "Enter") {
        event.preventDefault();
        const nextElement = document.getElementById(nextElementId);
        if (nextElement) {
            nextElement.focus();
        } else {
            document.getElementById('predict-btn').click();  // Trigger Predict button if at last input
        }
    }
}

// Add event listeners to each input field for the "Enter" key
for (let i = 1; i <= 10; i++) {
    document.getElementById(`t${i}`).addEventListener('keypress', (e) => {
        handleKeyPress(e, i < 10 ? `t${i + 1}` : 'conveyor-speed');
    });
}
document.getElementById('conveyor-speed').addEventListener('keypress', (e) => handleKeyPress(e, ''));

// Listen for the "Predict" button click
document.getElementById('predict-btn').addEventListener('click', async () => {
    // Collect the T1-T10 and Conveyor Speed values
    const t_values = {};
    let invalidInput = false;

    for (let i = 1; i <= 10; i++) {
        const tempValue = document.getElementById(`t${i}`).value;
        if (!isNumeric(tempValue)) {
            alert(`Please enter a valid number for T${i}.`);
            invalidInput = true;
            break;
        }
        t_values[`t${i}`] = parseFloat(tempValue);
    }

    const conveyorSpeed = document.getElementById('conveyor-speed').value;
    if (!isNumeric(conveyorSpeed)) {
        alert('Please enter a valid number for Conveyor Speed.');
        invalidInput = true;
    }

    if (invalidInput) {
        return;  // Exit if any input is invalid
    }

    // Combine data from both Main-Window and Flw-Window
    const predictionData = {
        ...mainWindowData,  // Includes solderPasteType and other Main-Window data
        ...t_values,
        conveyorSpeed: parseFloat(conveyorSpeed)
    };

    try {
        // Send the data to the Flask backend for prediction
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(predictionData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Receive the predictions from the backend
        const predictions = await response.json();

        console.log('Received predictions:', predictions);  // Log predictions for debugging

        // Open the Prediction-Window and pass the predictions to it
        window.electronAPI.send('open-prediction-window', {
            ...predictions,  // Pass predictions
            ...mainWindowData  // Pass all mainWindowData including solderPasteType
        });

    } catch (error) {
        console.error('Error fetching predictions:', error);
        alert('Error fetching predictions. Please try again.');
    }
});

// Back button functionality to reopen Main-Window
document.getElementById('back-btn').addEventListener('click', () => {
    // Send a message to the main process to reopen the Main-Window
    window.electronAPI.send('open-main-window');

    // Close the current Flw-Window
    window.close();
});
