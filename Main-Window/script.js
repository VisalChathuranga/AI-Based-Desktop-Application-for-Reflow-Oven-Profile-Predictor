// Get the form elements
const flwBtn = document.getElementById('flw-btn');
const openExcelBtn = document.getElementById('open-excel-btn');

// Event listener for the button to open the Excel file
openExcelBtn.addEventListener('click', () => {
    console.log('Opening Excel file with Find and Replace...');
    window.electronAPI.send('open-excel-file');
});

// Function to validate if input is numeric
function isNumeric(value) {
    return !isNaN(value) && value.trim() !== '';
}

// Function to move to the next input field on "Enter" press
function handleKeyPress(event, nextElementId) {
    if (event.key === "Enter") {
        event.preventDefault();
        const nextElement = document.getElementById(nextElementId);
        if (nextElement) {
            nextElement.focus();
        } else {
            flwBtn.click(); // If no next element, trigger the "FLW-VP1060N" button
        }
    }
}

// Add event listeners to each input field for the "Enter" key
document.getElementById('length').addEventListener('keypress', (e) => handleKeyPress(e, 'width'));
document.getElementById('width').addEventListener('keypress', (e) => handleKeyPress(e, 'thickness'));
document.getElementById('thickness').addEventListener('keypress', (e) => handleKeyPress(e, 'layers'));
document.getElementById('layers').addEventListener('keypress', (e) => handleKeyPress(e, 'cu-outer'));
document.getElementById('cu-outer').addEventListener('keypress', (e) => handleKeyPress(e, 'cu-inner'));
document.getElementById('cu-inner').addEventListener('keypress', (e) => handleKeyPress(e, 'solder-paste'));
document.getElementById('solder-paste').addEventListener('keypress', (e) => handleKeyPress(e, ''));

flwBtn.addEventListener('click', () => {
    // Get values from input fields
    const length = document.getElementById('length').value;
    const width = document.getElementById('width').value;
    const thickness = document.getElementById('thickness').value;
    const layers = document.getElementById('layers').value;
    const cuOuter = document.getElementById('cu-outer').value;
    const cuInner = document.getElementById('cu-inner').value;
    const solderPasteType = document.getElementById('solder-paste').value;

    // Validate input (check if any field is empty or not numeric)
    if (!length || !isNumeric(length)) {
        alert("Please enter a valid number for Length!");
        document.getElementById('length').focus();
        return;
    }
    if (!width || !isNumeric(width)) {
        alert("Please enter a valid number for Width!");
        document.getElementById('width').focus();
        return;
    }
    if (!thickness || !isNumeric(thickness)) {
        alert("Please enter a valid number for Thickness!");
        document.getElementById('thickness').focus();
        return;
    }
    if (!layers || !isNumeric(layers)) {
        alert("Please enter a valid number for Layers!");
        document.getElementById('layers').focus();
        return;
    }
    if (!cuOuter || !isNumeric(cuOuter)) {
        alert("Please enter a valid number for Cu Thickness (Outer)!");
        document.getElementById('cu-outer').focus();
        return;
    }
    if (!cuInner || !isNumeric(cuInner)) {
        alert("Please enter a valid number for Cu Thickness (Inner)!");
        document.getElementById('cu-inner').focus();
        return;
    }
    if (!solderPasteType) {
        alert("Please select a Solder Paste Type!");
        document.getElementById('solder-paste').focus();
        return;
    }

    // Prepare data to send
    const inputData = {
        length: parseFloat(length),
        width: parseFloat(width),
        thickness: parseFloat(thickness),
        layers: parseInt(layers),
        cuOuter: parseFloat(cuOuter),
        cuInner: parseFloat(cuInner),
        solderPasteType
    };

    console.log("Sending data to the main process:", inputData);

    // Send the data to the main process to open the Flw-Window
    window.electronAPI.send('open-flw-window', inputData);
});
