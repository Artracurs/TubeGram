document.getElementById('videoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const videoUrl = document.getElementById('videoUrl').value;
    fetch(`/get-formats?url=${videoUrl}`)
        .then(response => response.json())
        .then(formats => {
            const formatDiv = document.getElementById('formats');
            formatDiv.innerHTML = '';
            formats.forEach((format, index) => {
                const label = document.createElement('label');
                label.innerHTML = `${format.qualityLabel} - ${format.container} - ${format.codecs} - Размер: ${format.sizeEstimate} МБ <input type="checkbox" name="format" value="${format.itag}">`;
                formatDiv.appendChild(label);
                formatDiv.appendChild(document.createElement('br'));
            });
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Сохранить видео';
            saveButton.addEventListener('click', saveVideo);
            formatDiv.appendChild(saveButton);
        });
});

function saveVideo() {
    const selectedFormats = Array.from(document.querySelectorAll('input[name="format"]:checked'))
        .map(input => input.value);
    if (selectedFormats.length > 0) {
        window.open(`/download?url=${document.getElementById('videoUrl').value}&format=${selectedFormats[0]}`, '_blank');
    }
}
