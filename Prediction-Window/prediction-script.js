// Define the ranges for each solder paste type
const ranges = {
    'Koki S3X58-M406-3': {
        max_rising_slope: { min: 1.0, max: 3.0 }, // Example values
        soak_time: { min: 90, max: 120 },
        reflow_time: { min: 40, max: 60 },
        peak_temp: { min: 230, max: 250 }
    },
    'QUALITEK 6701 NC SnPb': {
        max_rising_slope: { min: 0.6, max: 2.2 }, // Example values
        soak_time: { min: 95, max: 125 },
        reflow_time: { min: 45, max: 65 },
        peak_temp: { min: 235, max: 255 }
    }
};

// Listen for predictions data from the main process
window.electronAPI.receive('show-predictions', (predictions) => {
    console.log('Received predictions:', predictions);  // Debugging log

    // Check if predictions data exists
    if (!predictions) {
        console.error('No predictions data received!');
        return;
    }

    // Round predictions to 3 decimal places
    const maxRisingSlope = predictions.max_rising_slope ? predictions.max_rising_slope.toFixed(3) : null;
    const soakTime = predictions.soak_time ? predictions.soak_time.toFixed(3) : null;
    const reflowTime = predictions.reflow_time ? predictions.reflow_time.toFixed(3) : null;
    const peakTemp = predictions.peak_temp ? predictions.peak_temp.toFixed(3) : null;

    // Check if solderPasteType exists
    const solderPasteType = predictions.solderPasteType;
    if (!solderPasteType) {
        console.error('Solder Paste Type not received!');
        return;
    }

    // Fetch the ranges based on the selected solder paste type
    const range = ranges[solderPasteType];
    if (!range) {
        console.error('Range not found for Solder Paste Type:', solderPasteType);
        return;
    }

    console.log('Using range:', range);  // Debugging log

    // Helper function to check if a value is within a range
    function checkInRange(value, min, max) {
        return value >= min && value <= max;
    }

    // Elements to update
    const maxRisingSlopeElement = document.getElementById('max-rising-slope');
    const soakTimeElement = document.getElementById('soak-time');
    const reflowTimeElement = document.getElementById('reflow-time');
    const peakTempElement = document.getElementById('peak-temp');

    // Set more visible vibrant colors with shadow for glow effect
    const greenStyle = 'color: #32CD32; text-shadow: 0px 0px 3px rgba(50, 205, 50, 0.7);';
    const redStyle = 'color: #FF4500; text-shadow: 0px 0px 3px rgba(255, 69, 0, 0.7);';

    // Max Rising Slope
    if (maxRisingSlope !== null) {
        maxRisingSlopeElement.innerText = maxRisingSlope;
        maxRisingSlopeElement.style.cssText = checkInRange(maxRisingSlope, range.max_rising_slope.min, range.max_rising_slope.max) ? greenStyle : redStyle;
    } else {
        maxRisingSlopeElement.innerText = 'N/A';
    }

    // Soak Time
    if (soakTime !== null) {
        soakTimeElement.innerText = soakTime;
        soakTimeElement.style.cssText = checkInRange(soakTime, range.soak_time.min, range.soak_time.max) ? greenStyle : redStyle;
    } else {
        soakTimeElement.innerText = 'N/A';
    }

    // Reflow Time
    if (reflowTime !== null) {
        reflowTimeElement.innerText = reflowTime;
        reflowTimeElement.style.cssText = checkInRange(reflowTime, range.reflow_time.min, range.reflow_time.max) ? greenStyle : redStyle;
    } else {
        reflowTimeElement.innerText = 'N/A';
    }

    // Peak Temp
    if (peakTemp !== null) {
        peakTempElement.innerText = peakTemp;
        peakTempElement.style.cssText = checkInRange(peakTemp, range.peak_temp.min, range.peak_temp.max) ? greenStyle : redStyle;
    } else {
        peakTempElement.innerText = 'N/A';
    }
});
