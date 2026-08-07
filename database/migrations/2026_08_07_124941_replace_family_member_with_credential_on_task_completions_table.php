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
        Schema::table('task_completions', function (Blueprint $table) {
            $table->foreignId('webauthn_credential_id')->nullable()->after('task_id')
                ->constrained('webauthn_credentials')->nullOnDelete();
        });

        Schema::table('task_completions', function (Blueprint $table) {
            $table->dropForeign(['family_member_id']);
            $table->dropColumn('family_member_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_completions', function (Blueprint $table) {
            $table->foreignId('family_member_id')->nullable()->after('task_id');
        });

        Schema::table('task_completions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('webauthn_credential_id');
        });
    }
};
