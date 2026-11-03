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
        Schema::table('exercises', function (Blueprint $table) {
            $table->string('youtube_id', 20)->nullable()->after('video_path');
            $table->unsignedInteger('youtube_start_seconds')->nullable()->after('youtube_id');
            $table->unsignedInteger('youtube_end_seconds')->nullable()->after('youtube_start_seconds');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropColumn(['youtube_id', 'youtube_start_seconds', 'youtube_end_seconds']);
        });
    }
};
