const API_URL = "https://lksrental.site/api.php?action=all";
const LOCAL_DATA_URL = "Data.json";
let appData = {
    rentals: [],
    lenses: [],
    inventory: {},
    last_updated: new Date().toISOString()
};
let currentRentalId = '';
let availableLenses = [];
let progressInterval;

function normalizeName(str) {
    if (!str) return '';
    return str
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/gi, '')
        .replace(/\b(series|edition|version)\b/gi, '')
        .trim();
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = `${percentage}%`;
    
    if (percentage < 100) {
        progressText.textContent = `Загрузка данных: ${percentage}%`;
    } else {
        progressText.textContent = 'Данные загружены!';
        setTimeout(() => {
            document.getElementById('progressContainer').style.display = 'none';
            progressText.style.display = 'none';
        }, 1000);
    }
}

function startProgress() {
    const progressContainer = document.getElementById('progressContainer');
    const progressText = document.getElementById('progressText');
    
    progressContainer.style.display = 'block';
    progressText.style.display = 'block';
    
    let progress = 0;
    updateProgressBar(progress);
    
    progressInterval = setInterval(() => {
        progress += 1;
        if (progress < 90) {
            updateProgressBar(progress);
        } else {
            clearInterval(progressInterval);
        }
    }, 50);
}

async function loadData() {
    const statusEl = document.getElementById('status');
    startProgress();
    
    try {
        const apiResponse = await fetch(API_URL);
        if (!apiResponse.ok) throw new Error('Ошибка загрузки данных с API');
        
        const apiResponseData = await apiResponse.json();
        
        // Handle new API format with success and database fields
        if (apiResponseData.success && apiResponseData.database) {
            // Convert inventory array to the expected format
            const inventoryByRental = {};
            if (apiResponseData.database.inventory) {
                apiResponseData.database.inventory.forEach(item => {
                    if (!inventoryByRental[item.rental_id]) {
                        inventoryByRental[item.rental_id] = [];
                    }
                    inventoryByRental[item.rental_id].push(item);
                });
            }
            
            appData = {
                rentals: apiResponseData.database.rentals || [],
                lenses: apiResponseData.database.lenses || [],
                inventory: inventoryByRental,
                last_updated: new Date().toISOString()
            };
            statusEl.textContent = `Данные загружены с нового API: ${new Date().toLocaleString()}`;
        } else {
            throw new Error(apiResponseData.error || 'Неизвестная ошибка API');
        }
        
    } catch (apiError) {
        console.error('Ошибка загрузки с API:', apiError);
        
        try {
            const localResponse = await fetch(LOCAL_DATA_URL);
            if (!localResponse.ok) throw new Error('Ошибка загрузки локальных данных');
            
            const localData = await localResponse.json();
            appData = localData;
            statusEl.textContent = `Данные загружены из локального файла: ${new Date(localData.last_updated).toLocaleString()}`;
            
        } catch (localError) {
            console.error('Ошибка загрузки локальных данных:', localError);
            statusEl.textContent = `Ошибка загрузки данных: ${localError.message}`;
            clearInterval(progressInterval);
            updateProgressBar(100);
            return;
        }
    } finally {
        clearInterval(progressInterval);
        updateProgressBar(100);
        
        if (appData.lenses && appData.lenses.length > 0) {
            appData.lenses.forEach(lens => {
                const imageCircle = typeof lens.image_circle === 'string' ? 
                    lens.image_circle : 
                    (lens.image_circle?.toString() || '');
                
                lens.coverage = calculateCoverageFormats(parseImageCircle(imageCircle));
            });
        }
        
        if (appData.rentals && appData.rentals.length > 0) {
            const select = document.getElementById('rentalSelect');
            select.innerHTML = '<option value="">Выберите рентал...</option>';
            appData.rentals.forEach(rental => {
                const option = document.createElement('option');
                option.value = rental.id;
                option.textContent = rental.name;
                select.appendChild(option);
            });
            
            collectAvailableLenses();
            loadAllLenses();
            populateFormatFilters();
            
            statusEl.style.display = 'block';
        } else {
            statusEl.textContent = 'Нет доступных данных';
            statusEl.style.display = 'block';
        }
    }
}

function collectAvailableLenses() {
    const lensIds = new Set();
    
    if (appData.inventory) {
        for (const rentalId in appData.inventory) {
            const rentalInventory = appData.inventory[rentalId];
            rentalInventory.forEach(item => {
                lensIds.add(item.lens_id);
            });
        }
    }
    
    availableLenses = appData.lenses ? 
        appData.lenses.filter(lens => lensIds.has(lens.id)) : 
        [];
}

function loadAllLenses() {
    const formatFilter = document.getElementById('formatFilter').value;
    const lenses = availableLenses;
    
    const filteredByFormat = formatFilter ? 
        lenses.filter(lens => lens.format === formatFilter) : 
        lenses;
    
    const container = document.getElementById('allLensesContainer');
    const totalEl = document.getElementById('totalLenses');
    const shownEl = document.getElementById('shownLenses');
    
    totalEl.textContent = availableLenses.length;
    shownEl.textContent = filteredByFormat.length;
    
    const groupedData = {};
    
    filteredByFormat.forEach(lens => {
        const normalizedManufacturer = normalizeName(lens.manufacturer);
        const normalizedSeries = normalizeName(lens.lens_name);
        
        if (!groupedData[normalizedManufacturer]) {
            groupedData[normalizedManufacturer] = {
                displayName: lens.manufacturer,
                series: {}
            };
        }
        
        if (!groupedData[normalizedManufacturer].series[normalizedSeries]) {
            groupedData[normalizedManufacturer].series[normalizedSeries] = {
                displayName: lens.lens_name,
                lenses: []
            };
        }
        
        groupedData[normalizedManufacturer].series[normalizedSeries].lenses.push(lens);
    });
    
    let html = '';
    
    for (const manufacturerKey in groupedData) {
        const manufacturerGroup = groupedData[manufacturerKey];
        html += `
        <div class="group">
            <div class="group-header">${manufacturerGroup.displayName}</div>
            <div class="group-content">
        `;
        
        for (const seriesKey in manufacturerGroup.series) {
            const seriesGroup = manufacturerGroup.series[seriesKey];
            html += `
            <div class="subgroup">
                <div class="subgroup-header">${seriesGroup.displayName}</div>
                <div class="lens-items">
            `;
            
            seriesGroup.lenses.forEach(lens => {
                html += `
                <div class="lens-item" data-lens-id="${lens.id}">
                    <div class="lens-name">${lens.display_name}</div>
                </div>
                `;
            });
            
            html += `
                </div>
            </div>
            `;
        }
        
        html += `
            </div>
        </div>
        `;
    }
    
    container.innerHTML = html || '<div class="empty">Объективы не найдены</div>';
    
    document.querySelectorAll('.lens-item').forEach(item => {
        item.addEventListener('click', function() {
            const lensId = this.getAttribute('data-lens-id');
            openLensCard(lensId);
        });
    });
    
    document.querySelectorAll('.group-header').forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('open');
        });
    });
    
    document.querySelectorAll('.subgroup-header').forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('open');
        });
    });
}

function populateFormatFilters() {
    const formats = [...new Set(availableLenses.map(lens => lens.format))];
    
    const formatFilter = document.getElementById('formatFilter');
    formatFilter.innerHTML = '<option value="">Все форматы</option>';
    formats.forEach(format => {
        if (format) {
            const option = document.createElement('option');
            option.value = format;
            option.textContent = format;
            formatFilter.appendChild(option);
        }
    });
    
    const rentalFormatFilter = document.getElementById('rentalFormatFilter');
    rentalFormatFilter.innerHTML = '<option value="">Все форматы</option>';
    formats.forEach(format => {
        if (format) {
            const option = document.createElement('option');
            option.value = format;
            option.textContent = format;
            rentalFormatFilter.appendChild(option);
        }
    });
    
    const charFormatFilter = document.getElementById('charFormatFilter');
    charFormatFilter.innerHTML = '<option value="">Все форматы</option>';
    formats.forEach(format => {
        if (format) {
            const option = document.createElement('option');
            option.value = format;
            option.textContent = format;
            charFormatFilter.appendChild(option);
        }
    });
}

function applyFilters() {
    loadAllLenses();
}

function openLensCard(lensId) {
    const lens = appData.lenses.find(l => l.id === lensId);
    if (!lens) return;

    window.__lastLensId = lensId;

    document.getElementById('lensCardTitle').textContent = lens.display_name;

    // Генерация поисковой ссылки
    const searchQuery = encodeURIComponent(lens.display_name + " lens");
    const bhPhotoLink = `https://www.google.com/search?tbm=isch&q=${searchQuery}`;

    const specsEl = document.getElementById('lensSpecs');
    specsEl.innerHTML = `
        <div class="spec-item">
            <div class="spec-label">Производитель</div>
            <div class="spec-value">${lens.manufacturer}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Серия</div>
            <div class="spec-value">${lens.lens_name}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Формат</div>
            <div class="spec-value">${lens.format}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Фокусное расстояние</div>
            <div class="spec-value">${lens.focal_length}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Светосила</div>
            <div class="spec-value">${lens.aperture}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Коэффициент сжатия</div>
            <div class="spec-value">${lens.squeeze_factor || 'N/A'}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Мин. дистанция фокусировки</div>
            <div class="spec-value">${lens.close_focus_in} (${lens.close_focus_cm})</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Круг изображения</div>
            <div class="spec-value">${lens.image_circle}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Длина</div>
            <div class="spec-value">${lens.length}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Диаметр переднего элемента</div>
            <div class="spec-value">${lens.front_diameter}</div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Покрываемые форматы</div>
            <div class="spec-value">
                <button class="check-visualizer-btn" data-lens-id="${lens.id}" style="background:#4285f4;color:#fff;border:none;border-radius:7px;padding:7px 18px;cursor:pointer;font-size:1em;">
                    Проверить
                </button>
            </div>
        </div>
        <div class="spec-item">
            <div class="spec-label">Поиск</div>
            <div class="spec-value">
                <a href="${bhPhotoLink}" target="_blank" class="search-link">
                    🔍 Google
                </a>
            </div>
        </div>
    `;

    setTimeout(()=>{
        document.querySelectorAll('.check-visualizer-btn').forEach(btn=>{
            btn.onclick = function(){
                const lensId = this.getAttribute('data-lens-id');
                window.open(`visualizer.html#lens=${encodeURIComponent(lensId)}`, '_blank');
            }
        })
    }, 100);

    const rentalsListEl = document.getElementById('lensRentalsList');
    let rentalsHtml = '';

    if (appData.inventory) {
        for (const rentalId in appData.inventory) {
            const rentalInventory = appData.inventory[rentalId];
            const hasLens = rentalInventory.some(item => item.lens_id === lensId);

            if (hasLens) {
                const rental = appData.rentals.find(r => r.id === rentalId);
                if (rental) {
                    rentalsHtml += `
                    <div class="rental-item" data-rental-id="${rental.id}">
                        <div class="rental-name">${rental.name}</div>
                        <div class="rental-info">📍 ${rental.address}</div>
                        <div class="rental-info">📞 ${rental.phone}</div>
                        <div class="rental-info">🌐 <a href="${rental.website}" target="_blank">${rental.website}</a></div>
                    </div>
                    `;
                }
            }
        }
    }

    rentalsListEl.innerHTML = rentalsHtml || '<div class="empty">Этот объектив не найден ни в одном рентале</div>';

    document.querySelectorAll('.rental-item').forEach(item => {
        item.addEventListener('click', function() {
            const rentalId = this.getAttribute('data-rental-id');
            closeLensCard();

            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector('[data-tab="rental-view"]').classList.add('active');
            document.getElementById('rental-view').classList.add('active');

            document.getElementById('rentalSelect').value = rentalId;
            showLenses(rentalId);

            window.scrollTo(0, 0);
        });
    });

    document.getElementById('lensCardOverlay').style.display = 'block';
    document.getElementById('lensCard').style.display = 'block';
}

function closeLensCard() {
    document.getElementById('lensCardOverlay').style.display = 'none';
    document.getElementById('lensCard').style.display = 'none';
}

function showLenses(rentalId) {
    currentRentalId = rentalId;
    const lensContainer = document.getElementById('lensContainer');
    const statusEl = document.getElementById('status');
    lensContainer.innerHTML = '';
    
    if (!rentalId) {
        lensContainer.style.display = 'none';
        return;
    }
    
    const rental = appData.rentals.find(r => r.id === rentalId);
    const rentalInventory = appData.inventory && appData.inventory[rentalId] || [];
    
    if (rentalInventory.length === 0) {
        lensContainer.innerHTML = '<div class="empty">Нет данных об оптике</div>';
        lensContainer.style.display = 'block';
        return;
    }
    
    const lensIds = rentalInventory.map(item => item.lens_id);
    const filteredLenses = appData.lenses ? appData.lenses.filter(lens => lensIds.includes(lens.id)) : [];
    
    const formatFilter = document.getElementById('rentalFormatFilter').value;
    const filteredByFormat = formatFilter ? 
        filteredLenses.filter(lens => lens.format === formatFilter) : 
        filteredLenses;
    
    const groupedData = {};
    
    filteredByFormat.forEach(lens => {
        const normalizedManufacturer = normalizeName(lens.manufacturer);
        const normalizedSeries = normalizeName(lens.lens_name);
        
        if (!groupedData[normalizedManufacturer]) {
            groupedData[normalizedManufacturer] = {
                displayName: lens.manufacturer,
                series: {}
            };
        }
        
        if (!groupedData[normalizedManufacturer].series[normalizedSeries]) {
            groupedData[normalizedManufacturer].series[normalizedSeries] = {
                displayName: lens.lens_name,
                lenses: []
            };
        }
        
        groupedData[normalizedManufacturer].series[normalizedSeries].lenses.push(lens);
    });
    
    let html = '';
    
    if (rental) {
        html += `
        <div class="sticky-rental-header-wrapper">
            <div class="sticky-rental-header">${rental.name}</div>
        </div>
        `;
    }
    
    for (const manufacturerKey in groupedData) {
        const manufacturerGroup = groupedData[manufacturerKey];
        html += `
        <div class="group">
            <div class="group-header">${manufacturerGroup.displayName}</div>
            <div class="group-content">
        `;
        
        for (const seriesKey in manufacturerGroup.series) {
            const seriesGroup = manufacturerGroup.series[seriesKey];
            html += `
            <div class="subgroup">
                <div class="subgroup-header">${seriesGroup.displayName}</div>
                <div class="lens-items">
            `;
            
            seriesGroup.lenses.forEach(lens => {
                html += `
                <div class="lens-item" data-lens-id="${lens.id}">
                    <div class="lens-name">${lens.display_name}</div>
                </div>
                `;
            });
            
            html += `
                </div>
            </div>
            `;
        }
        
        html += `
            </div>
        </div>
        `;
    }
    
    lensContainer.innerHTML = html;
    lensContainer.style.display = 'block';
    statusEl.textContent = `Найдено объективов: ${filteredByFormat.length}`;
    statusEl.style.display = 'block';
    
    document.querySelectorAll('.lens-item').forEach(item => {
        item.addEventListener('click', function() {
            const lensId = this.getAttribute('data-lens-id');
            openLensCard(lensId);
        });
    });
    
    document.querySelectorAll('.group-header').forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('open');
        });
    });
    
    document.querySelectorAll('.subgroup-header').forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('open');
        });
    });
}

function parseImageCircle(value) {
    if (typeof value === 'number') {
        return value;
    }
    
    if (typeof value === 'string') {
        const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
        return isNaN(num) ? 0 : num;
    }
    
    return 0;
}

function calculateCoverageFormats(imageCircle) {
    const formats = [];
    if (imageCircle >= 14.54) formats.push("S16");
    if (imageCircle >= 31.11) formats.push("S35");
    if (imageCircle >= 43.27) formats.push("FF");
    if (imageCircle >= 65) formats.push("65mm");
    return formats;
}

function parseFocalRange(value) {
    if (typeof value === 'number') {
        return {
            min: value,
            max: value,
            isZoom: false
        };
    }
    
    if (typeof value === 'string') {
        const numbers = value.match(/\d+/g) || [];
        const nums = numbers.map(Number);
        
        if (nums.length === 0) {
            return {
                min: 0,
                max: 0,
                isZoom: false
            };
        }
        
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        
        return {
            min,
            max,
            isZoom: max - min > 1
        };
    }
    
    return {
        min: 0,
        max: 0,
        isZoom: false
    };
}

function loadCharacteristicsLenses() {
    const charFormat = document.getElementById('charFormatFilter').value;
    const focalRange = document.getElementById('focalRangeFilter').value;
    const coverage = document.getElementById('coverageFilter').value;
    const availableOnly = document.getElementById('availableOnlyFilter').checked;
    
    let filtered = [...appData.lenses];
    
    if (charFormat) {
        filtered = filtered.filter(lens => lens.format === charFormat);
    }
    
    if (focalRange) {
        filtered = filtered.filter(lens => {
            const { min, max } = parseFocalRange(lens.focal_length);
            
            switch(focalRange) {
                case 'ultrawide': 
                    return min >= 0 && max <= 12;
                case 'wide': 
                    return min >= 13 && max <= 35;
                case 'standard': 
                    return min >= 35 && max <= 70;
                case 'tele': 
                    return min >= 70 && max <= 179;
                case 'supertele': 
                    return min >= 180;
                default: 
                    return true;
            }
        });
    }
    
    if (coverage) {
        filtered = filtered.filter(lens => 
            lens.coverage?.includes(coverage)
        );
    }
    
    if (availableOnly) {
        const availableLensIds = new Set();
        for (const rentalId in appData.inventory) {
            appData.inventory[rentalId].forEach(item => {
                availableLensIds.add(item.lens_id);
            });
        }
        filtered = filtered.filter(lens => availableLensIds.has(lens.id));
    }
    
    document.getElementById('totalCharLenses').textContent = appData.lenses.length;
    document.getElementById('shownCharLenses').textContent = filtered.length;
    
    const container = document.getElementById('charLensesContainer');
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty">Объективы не найдены</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(lens => {
        const { min, max, isZoom } = parseFocalRange(lens.focal_length);
        const focalText = isZoom ? `${min}-${max}мм` : `${min}мм`;
        
        html += `
        <div class="lens-item" data-lens-id="${lens.id}">
            <div class="lens-name">${lens.display_name}</div>
            <div class="lens-specs-compact">
                <div class="spec-compact">${focalText}</div>
                <div class="spec-compact">${lens.aperture}</div>
                <div class="spec-compact">${lens.format}</div>
                <div class="spec-compact">${lens.coverage?.join(' ') || 'N/A'}</div>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
    
    document.querySelectorAll('#charLensesContainer .lens-item').forEach(item => {
        item.addEventListener('click', function() {
            const lensId = this.getAttribute('data-lens-id');
            openLensCard(lensId);
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'characteristics') {
                loadCharacteristicsLenses();
            }
        });
    });
    
    const rentalSelect = document.getElementById('rentalSelect');
    rentalSelect.addEventListener('change', (e) => {
        showLenses(e.target.value);
    });
    
    document.getElementById('closeCardBtn').addEventListener('click', closeLensCard);
    document.getElementById('lensCardOverlay').addEventListener('click', closeLensCard);
    
    document.getElementById('formatFilter').addEventListener('change', applyFilters);
    document.getElementById('rentalFormatFilter').addEventListener('change', () => {
        if (currentRentalId) showLenses(currentRentalId);
    });
    
    document.getElementById('refreshButton').addEventListener('click', loadData);
    
    document.getElementById('charFormatFilter').addEventListener('change', loadCharacteristicsLenses);
    document.getElementById('focalRangeFilter').addEventListener('change', loadCharacteristicsLenses);
    document.getElementById('coverageFilter').addEventListener('change', loadCharacteristicsLenses);
    document.getElementById('visualizerButton').addEventListener('click', function() {
        window.open('visualizer.html', '_blank');
    });
    document.getElementById('availableOnlyFilter').addEventListener('change', loadCharacteristicsLenses);
});