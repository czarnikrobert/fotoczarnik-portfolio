<?php
// Formularz kontaktowy na Hostingerze (zastępuje Netlify Forms). build.js kopiuje ten plik do public/.
// Adresy są w pliku konfiguracyjnym w katalogu domowym konta, poza public_html i poza repozytorium (repo jest publiczne):
//   ~/kontakt-config.php  ->  <?php return ['to' => '...', 'from' => 'formularz@photoczarnik.pl'];
declare(strict_types=1);

function redirect(string $path): never
{
    header('Location: ' . $path, true, 303);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('/contact');
}

// Pułapka na boty: ukryte pole „company” musi zostać puste. Botowi udajemy sukces.
if (trim((string) ($_POST['company'] ?? '')) !== '') {
    redirect('/thanks.html');
}

$name = trim(strip_tags((string) ($_POST['name'] ?? '')));
$email = trim((string) ($_POST['email'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

$valid = $name !== '' && mb_strlen($name) <= 100
    && filter_var($email, FILTER_VALIDATE_EMAIL) !== false
    && $message !== '' && mb_strlen($message) <= 5000;
if (!$valid) {
    redirect('/contact?blad=1');
}

$config = require dirname(__DIR__, 3) . '/kontakt-config.php'; // public_html -> photoczarnik.pl -> domains -> ~

// Bez nowych linii w nagłówkach (ochrona przed wstrzyknięciem nagłówków); e-mail sprawdził już filter_var.
$name = str_replace(["\r", "\n"], ' ', $name);

$subject = '=?UTF-8?B?' . base64_encode('Wiadomość ze strony PhotoCzarnik od ' . $name) . '?=';
$body = "Imię: {$name}\nE-mail: {$email}\n\n{$message}\n";
$headers = implode("\r\n", [
    'From: PhotoCzarnik <' . $config['from'] . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = mail($config['to'], $subject, $body, $headers, '-f' . $config['from']);
redirect($sent ? '/thanks.html' : '/contact?blad=1');
