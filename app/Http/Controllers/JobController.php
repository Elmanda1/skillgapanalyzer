<?php

namespace App\Http\Controllers;

use App\Models\JobVacancy;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));

        $query = JobVacancy::query()
            ->with(['skills.aliases'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('title', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhereHas('skills', function ($skillQuery) use ($search) {
                            $skillQuery->where('nama', 'like', "%{$search}%")
                                ->orWhereHas('aliases', function ($aliasQuery) use ($search) {
                                    $aliasQuery->where('alias_name', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->when($request->filled('lokasi'), fn ($q) => $q->where('lokasi', $request->string('lokasi')))
            ->when($request->filled('sektor'), fn ($q) => $q->where('sektor', $request->string('sektor')))
            ->when($request->filled('is_remote'), fn ($q) => $q->where('is_remote', $request->boolean('is_remote')));

        $jobs = $query
            ->orderByDesc('published_at')
            ->paginate(20)
            ->withQueryString();

        $jobs->getCollection()->transform(function ($job) {
            $scrapedAt = $job->updated_at ?? $job->created_at ?? $job->published_at;
            $job->last_scraped_at = $scrapedAt ? $scrapedAt->format('d/m/Y H:i:s') : date('d/m/Y H:i:s');
            return $job;
        });

        return inertia('JobBrowser', [
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'lokasi', 'sektor', 'is_remote']),
            'totalDatabaseJobs' => JobVacancy::query()->count(),
            'lokasiOptions' => JobVacancy::query()
                ->distinct()
                ->orderBy('lokasi')
                ->pluck('lokasi')
                ->filter()
                ->values(),
            'sektorOptions' => JobVacancy::query()
                ->distinct()
                ->orderBy('sektor')
                ->pluck('sektor')
                ->filter()
                ->values(),
        ]);
    }
}