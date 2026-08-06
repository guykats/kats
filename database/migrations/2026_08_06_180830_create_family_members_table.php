<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('family_members', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color');
            $table->timestamps();
        });

        $now = now();
        DB::table('family_members')->insert([
            ['name' => 'ניני', 'color' => '#f43f5e', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'הודי', 'color' => '#f59e0b', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'אמא', 'color' => '#a855f7', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'אבא', 'color' => '#3b82f6', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('family_members');
    }
};
