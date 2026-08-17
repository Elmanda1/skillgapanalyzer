<?php

namespace App\Http\Controllers;

use App\Models\JobVacancy;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(Request $request)
    {
        $query = JobVacancy::query()
            ->with('skills')
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where(function ($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->string('search') . '%')
                        ->orWhere('company_name', 'like', '%' . $request->string('search') . '%');
                });
            })
            ->when($request->filled('lokasi'), fn ($q) => $q->where('lokasi', $request->string('lokasi')))
            ->when($request->filled('sektor'), fn ($q) => $q->where('sektor', $request->string('sektor')))
            ->when($request->filled('is_remote'), fn ($q) => $q->where('is_remote', $request->boolean('is_remote')));

        $jobs = $query
            ->orderByDesc('published_at')
            ->paginate(20)
            ->withQueryString();

        return inertia('JobBrowser', [
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'lokasi', 'sektor', 'is_remote']),
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