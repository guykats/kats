<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('webauthn_credentials')
            ->where('name', 'אדמין')
            ->update(['name' => 'אבא']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('webauthn_credentials')
            ->where('name', 'אבא')
            ->update(['name' => 'אדמין']);
    }
};
