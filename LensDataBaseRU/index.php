<?php
session_start();
// Проверка пароля через сессию
if (!isset($_SESSION['ldb_access']) || $_SESSION['ldb_access'] !== true) {
    header('Location: auth.php');
    exit;
}

// (Если хочешь добавить счетчик посещений, раскомментируй строку ниже)
 include 'counter.php';
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lens Data Base β v1.7</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📷</text></svg>">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="top-buttons">
        <button id="refreshButton" class="refresh-button" title="Обновить данные">🔄</button>
        <button id="logoutButton" class="logout-button" title="Выйти">🚪</button>
    </div>

    <div id="mainContent">
        <h1>Lens Data Baseβ v1.7</h1>
        
        <!-- Если хочешь показывать счетчик, раскомментируй строку ниже -->
        <!-- <div class="subtitle"><?php // include 'counter.php'; ?></div> -->

        <div id="progressContainer" class="progress-container">
            <div id="progressBar" class="progress-bar"></div>
        </div>
        <div id="progressText" class="progress-text">Загрузка данных...</div>
        
        <div class="tabs">
            <div class="tab active" data-tab="rental-view">По ренталам</div>
            <div class="tab" data-tab="all-lenses">Весь список</div>
            <div class="tab" data-tab="characteristics">По характеристикам</div>
        </div>
        
        <div id="rental-view" class="tab-content active">
            <div class="card">
                <div class="filter-group">
                    <label class="filter-label">Рентал</label>
                    <select id="rentalSelect" class="filter-select">
                        <option value="">Выберите рентал...</option>
                    </select>
                </div>
                
                <div class="filter-group" style="margin-top: 15px;">
                    <label class="filter-label">Формат</label>
                    <select id="rentalFormatFilter" class="filter-select">
                        <option value="">Все форматы</option>
                    </select>
                </div>
                
                <div id="status" class="status" style="display: none; margin-top: 20px;">
                    Загрузка данных...
                </div>
                
                <div id="lensContainer" style="display: none; margin-top: 20px;"></div>
            </div>
        </div>
        
        <div id="all-lenses" class="tab-content">
            <div class="filters">
                <div class="filter-group">
                    <label class="filter-label">Формат</label>
                    <select id="formatFilter" class="filter-select">
                        <option value="">Все форматы</option>
                    </select>
                </div>
            </div>
            
            <div class="filter-status" id="filterStatus">
                Все объективы: <span id="totalLenses">0</span> | Показано: <span id="shownLenses">0</span>
            </div>
            
            <div id="allLensesContainer"></div>
        </div>
        
        <div id="characteristics" class="tab-content">
            <div class="filters">
                <div class="filter-group">
                    <label class="filter-label">Формат</label>
                    <select id="charFormatFilter" class="filter-select">
                        <option value="">Все форматы</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label class="filter-label">Диапазон ФР (мм)</label>
                    <select id="focalRangeFilter" class="filter-select">
                        <option value="">Все диапазоны</option>
                        <option value="ultrawide">Сверхширокие (до 12)</option>
                        <option value="wide">Широкоугольные (13-35)</option>
                        <option value="standard">Стандартные (35-70)</option>
                        <option value="tele">Телеобъективы (70-135)</option>
                        <option value="supertele">Супертеле (180+)</option>
                    </select>
                </div>
                
                <div class="filter-group hidden">
                    <label class="filter-label">Формат покрытия</label>
                    <select id="coverageFilter" class="filter-select">
                        <option value="">Все форматы</option>
                        <option value="S16">Super 16</option>
                        <option value="S35">Super 35</option>
                        <option value="FF">Full Frame</option>
                        <option value="65mm">65mm</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label class="filter-checkbox">
                        <input type="checkbox" id="availableOnlyFilter">
                        Только доступные в ренталах
                    </label>
                </div>
            </div>
            
            <div class="filter-status">
                Все объективы: <span id="totalCharLenses">0</span> | Показано: <span id="shownCharLenses">0</span>
            </div>
            
            <div id="charLensesContainer" class="lens-items" style="margin-top: 20px;"></div>
        </div>
        
        <div class="lens-card-overlay" id="lensCardOverlay"></div>
        <div class="lens-card" id="lensCard">
            <div class="lens-card-header">
                <div class="lens-card-title" id="lensCardTitle"></div>
                <div class="close-card" id="closeCardBtn">×</div>
            </div>
            <div class="lens-card-body">
                <div class="lens-specs" id="lensSpecs"></div>
                
                <div class="lens-rentals">
                    <h3>Доступен в ренталах:</h3>
                    <div id="lensRentalsList"></div>
                </div>
            </div>
        </div>
        
        <footer class="footer">
            Created by <span class="footer-highlight">Skvora007</span>
        </footer>
    </div>

    <script src="script.js"></script>
    <script>
        // Обработчики кнопок
        document.getElementById('logoutButton').addEventListener('click', function() {
            // Удаляем доступ и редиректим на ввод пароля
            fetch('logout.php').then(()=>{window.location='auth.php'});
            // Если нет logout.php, то просто:
            // window.location = 'auth.php';
        });
        // Кнопка визуализатора удалена по просьбе пользователя
    </script>
</body>
</html>