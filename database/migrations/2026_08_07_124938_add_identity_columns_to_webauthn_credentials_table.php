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
        Schema::table('webauthn_credentials', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
            $table->string('color')->nullable()->after('name');
            $table->boolean('is_admin')->default(false)->after('color');
            $table->timestamp('approved_at')->nullable()->after('is_admin');
        });

        // A row can already exist here from testing the old parent-only lock. Without
        // this, the bootstrap check ("no credential exists yet") would never see an
        // empty table again, and that leftover row would sit forever as an unapproved,
        // non-admin device with nobody able to approve it — a permanent lockout.
        $firstId = DB::table('webauthn_credentials')->orderBy('id')->value('id');
        if ($firstId !== null) {
            DB::table('webauthn_credentials')->where('id', $firstId)->update([
                'name' => 'אדמין',
                'color' => '#3b82f6',
                'is_admin' => true,
                'approved_at' => now(),
            ]);
        }
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
