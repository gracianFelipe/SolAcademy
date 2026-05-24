<?php
/**
 * ARQUIVO: version.php
 * DESCRIÇÃO: Arquivo de controle de versão exigido pelo Moodle.
 * Define a versão, dependências e informações de lançamento do plugin local_solacademy.
 */
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_solacademy'; // Nome oficial do plugin
$plugin->version = 2026032501;           // Versão (Ano, Mês, Dia, 01 - Atualizado)
$plugin->requires = 2022112800;          // Requer Moodle 4.1 ou superior
$plugin->maturity = MATURITY_STABLE;     // Nível de estabilidade
$plugin->release = '1.1';                // Versão de lançamento