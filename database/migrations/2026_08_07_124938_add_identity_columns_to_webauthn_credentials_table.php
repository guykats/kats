<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('webauthn_credentials', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
            $table->string('color')->nullable()->after('name');
            $table->boolean('is_admin')->default(false)->after('color');
            $table->timestamp('approved_at')->nullable()->after('is_admin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('webauthn_credentials', function (Blueprint $table) {
            $table->dropColumn(['name', 'color', 'is_admin', 'approved_at']);
        });
    }
};
