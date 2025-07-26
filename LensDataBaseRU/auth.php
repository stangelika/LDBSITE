<?php
session_start();
$correct_password = 'LensDataBase2025';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    if ($password === $correct_password) {
        $_SESSION['ldb_access'] = true;
        // redirect to main
        header('Location: index.php');
        exit;
    } else {
        $error = "Неверный пароль!";
    }
}

// Если уже ввели пароль, редирект на главную
if (isset($_SESSION['ldb_access']) && $_SESSION['ldb_access'] === true) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Lens Data Base — Вход</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="styles.css">
    <style>
        body { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #23263c;}
        .auth-card { max-width: 360px; padding: 38px 32px; border-radius: 18px; background: rgba(28,34,48,0.97);}
    </style>
</head>
<body>
    <div class="auth-card">
        <h2 style="text-align:center;">Lens Data Base</h2>
        <form method="POST">
            <input type="password" name="password" placeholder="Введите пароль" required style="width:100%;padding:15px 12px;font-size:1.09em;border-radius:8px;border:none;margin-bottom:12px;">
            <button type="submit" style="width:100%;padding:14px 0;font-size:1.08em;border-radius:8px;border:none;background:#4285f4;color:#fff;font-weight:700;">Войти</button>
        </form>
        <?php if (isset($error)): ?>
            <div class="error" style="margin-top:10px;"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        <div style="margin-top:20px;text-align:center;color:#b3bbc7;">Пароль: <b>LensDataBase2025</b></div>
    </div>
</body>
</html>