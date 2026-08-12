<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * Lets CI trigger a deploy over plain HTTPS instead of the server having to
 * pull on a cron or GitHub Actions having to SSH in — both of which turned
 * out to be unreliable on this host (cron never fired; Hostinger silently
 * drops inbound SSH from GitHub's IP ranges). No secret is required: this
 * only ever pulls code that's already public on the `deploy` branch, so the
 * worst an unauthenticated caller can do is force a redundant, idempotent
 * resync — mitigated by the lock below anyway.
 */
class DeployWebhookController extends Controller
{
    public function handle(): JsonResponse
    {
        $lock = Cache::lock('deploy-webhook', 120);

        if (! $lock->get()) {
            return response()->json(['ok' => true, 'deployed' => false, 'reason' => 'already running']);
        }

        $base = base_path();
        $log = [];

        try {
            $log[] = $this->run(['git', 'fetch', 'origin', 'deploy'], $base);
            $local = trim($this->run(['git', 'rev-parse', 'HEAD'], $base));
            $remote = trim($this->run(['git', 'rev-parse', 'origin/deploy'], $base));

            if ($local === $remote) {
                return response()->json(['ok' => true, 'deployed' => false, 'sha' => $local]);
            }

            $log[] = $this->run(['php', 'artisan', 'down', '--render=errors::503', '--retry=30'], $base, allowFailure: true);
            $log[] = $this->run(['git', 'reset', '--hard', 'origin/deploy'], $base);
            $log[] = $this->run(['composer', 'install', '--no-dev', '--optimize-autoloader', '--no-interaction'], $base);
            $log[] = $this->run(['php', 'artisan', 'config:clear'], $base);
            $log[] = $this->run(['php', 'artisan', 'migrate', '--force'], $base);
            $log[] = $this->run(['php', 'artisan', 'storage:link'], $base, allowFailure: true);
            $log[] = $this->run(['php', 'artisan', 'config:cache'], $base);
            $log[] = $this->run(['php', 'artisan', 'route:cache'], $base);
            $log[] = $this->run(['php', 'artisan', 'view:cache'], $base);
            $log[] = $this->run(['php', 'artisan', 'up'], $base);

            return response()->json(['ok' => true, 'deployed' => true, 'sha' => $remote, 'log' => $log]);
        } catch (Throwable $e) {
            $this->run(['php', 'artisan', 'up'], $base, allowFailure: true);

            return response()->json(['ok' => false, 'error' => $e->getMessage(), 'log' => $log], 500);
        } finally {
            $lock->release();
        }
    }

    private function run(array $command, string $cwd, bool $allowFailure = false): string
    {
        $phpBinary = env('DEPLOY_PHP_BINARY', '/opt/alt/php83/usr/bin/php');
        if ($command[0] === 'php') {
            $command[0] = $phpBinary;
        }

        // PHP-FPM's exec environment is minimal (no shell profile ever ran), so PATH,
        // HOME, and COMPOSER_HOME all need to be supplied explicitly or composer/git
        // fail in ways that look unrelated (e.g. "HOME must be set").
        $home = env('DEPLOY_HOME_DIR', getenv('HOME') ?: '/home/u823311221');

        $env = [
            'PATH' => dirname($phpBinary).':/usr/local/bin:/usr/bin:/bin:'.getenv('PATH'),
            'HOME' => $home,
            'COMPOSER_HOME' => $home.'/.composer',
            'COMPOSER_ALLOW_SUPERUSER' => '1',
        ];

        $process = new Process($command, $cwd, $env);
        $process->setTimeout(300);
        $process->run();

        $output = trim($process->getOutput()."\n".$process->getErrorOutput());

        if (! $process->isSuccessful() && ! $allowFailure) {
            throw new RuntimeException(implode(' ', $command).' failed: '.$output);
        }

        return implode(' ', $command).": {$output}";
    }
}
