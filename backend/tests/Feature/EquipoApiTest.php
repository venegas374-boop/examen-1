<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();

    $respuesta = $this->postJson('/api/equipos', [
        'codigo'            => 'EQ-0999',
        'nombre'            => 'Laptop de prueba',
        'categoria_id'      => $categoria->id,
        'fecha_adquisicion' => '2026-01-15',
        'costo_interno'     => 450000,
    ]);

    $id = $respuesta->json('data.id');

    $respuesta
        ->assertCreated()
        ->assertHeader('Location', route('equipos.show', $id))
        ->assertExactJson(['data' => [
            'id'                => $id,
            'codigo'            => 'EQ-0999',
            'nombre'            => 'Laptop de prueba',
            'estado'            => 'disponible',
            'fecha_adquisicion' => '2026-01-15',
            'categoria'         => ['id' => $categoria->id, 'nombre' => $categoria->nombre],
        ]]);

    $this->assertDatabaseHas('equipos', ['id' => $id, 'codigo' => 'EQ-0999']);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $this->postJson('/api/equipos', [
        'codigo'            => 'XX-1',
        'nombre'            => 'ab',
        'categoria_id'      => 9999,
        'estado'            => 'prestado',
        'fecha_adquisicion' => now()->addDay()->toDateString(),
        'costo_interno'     => -5,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo'            => 'El código debe tener el formato EQ-0000.',
            'nombre'            => 'El nombre debe tener al menos 3 caracteres.',
            'categoria_id'      => 'La categoría seleccionada no existe.',
            'estado'            => 'El estado solo puede ser disponible o mantenimiento.',
            'fecha_adquisicion' => 'La fecha de adquisición no puede ser futura.',
            'costo_interno'     => 'El costo no puede ser negativo.',
        ]);

    $this->assertDatabaseCount('equipos', 0);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->prestado()->create();

    $this->deleteJson("/api/equipos/{$equipo->id}")
        ->assertConflict()
        ->assertExactJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo'  => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id, 'estado' => 'prestado']);
});