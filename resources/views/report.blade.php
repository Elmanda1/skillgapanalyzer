<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Penyelarasan Industri - {{ $studyProgram->nama_prodi }}</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --brand: #064e3b;
            --brand-light: #f0fdf4;
            --text: #111827;
            --text-secondary: #4b5563;
            --text-muted: #9ca3af;
            --border: #e5e7eb;
        }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text);
            line-height: 1.5;
            margin: 0;
            padding: 40px;
            background-color: #fff;
        }

        .header {
            border-b: 3px double var(--brand);
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px double var(--text);
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo-placeholder {
            width: 60px;
            height: 60px;
            background-color: var(--brand);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 24px;
        }

        .institution-title h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 800;
            margin: 0;
            color: var(--brand);
            text-transform: uppercase;
        }

        .institution-title p {
            font-size: 12px;
            color: var(--text-secondary);
            margin: 2px 0 0 0;
        }

        .report-title-container {
            text-align: center;
            margin-bottom: 30px;
        }

        .report-title-container h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 22px;
            font-weight: 800;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .report-title-container p {
            font-size: 14px;
            color: var(--text-secondary);
            margin: 5px 0 0 0;
        }

        .metadata-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 15px;
            background-color: var(--brand-light);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 35px;
        }

        .metadata-item p {
            margin: 4px 0;
            font-size: 13px;
        }

        .metadata-item strong {
            color: var(--brand);
        }

        .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 700;
            border-bottom: 2px solid var(--brand);
            padding-bottom: 5px;
            margin-top: 30px;
            margin-bottom: 15px;
            text-transform: uppercase;
            color: var(--brand);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 12px;
        }

        th {
            background-color: #f9fafb;
            border-bottom: 2px solid var(--border);
            color: var(--text-secondary);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        tr:nth-child(even) {
            background-color: #fbfbfb;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .badge-red {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .badge-yellow {
            background-color: #fef3c7;
            color: #92400e;
        }

        .badge-green {
            background-color: #d1fae5;
            color: #065f46;
        }

        .badge-gray {
            background-color: #f3f4f6;
            color: #374151;
        }

        .summary-box {
            display: grid;
            grid-template-cols: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            text-align: center;
        }

        .summary-card {
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 15px;
            background-color: #fff;
        }

        .summary-card h3 {
            font-size: 24px;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            margin: 0;
            color: var(--brand);
        }

        .summary-card p {
            font-size: 11px;
            color: var(--text-secondary);
            margin: 5px 0 0 0;
            text-transform: uppercase;
            font-weight: 600;
        }

        .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 12px;
        }

        .signature-area {
            text-align: center;
            width: 200px;
        }

        .signature-line {
            border-bottom: 1px solid var(--text);
            margin-top: 60px;
            margin-bottom: 5px;
            height: 20px;
        }

        @media print {
            body {
                padding: 0;
                background-color: white;
            }
            .no-print {
                display: none;
            }
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>

    <!-- Header / Kop Laporan -->
    <div class="header">
        <div class="logo-section">
            <div class="logo-placeholder">SGA</div>
            <div class="institution-title">
                <h1>{{ $studyProgram->nama_institusi }}</h1>
                <p>Sistem Akreditasi Penyelarasan Kurikulum & Kebutuhan Keterampilan Industri</p>
            </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: var(--text-secondary);">
            SGA-{{ date('Ymd-His') }}
        </div>
    </div>

    <!-- Judul Dokumen -->
    <div class="report-title-container">
        <h2>Laporan Penyelarasan Industri & Kurikulum</h2>
        <p>Instrumen Pendukung Evaluasi Akreditasi BAN-PT</p>
    </div>

    <!-- Metadata Informasi -->
    <div class="metadata-grid">
        <div class="metadata-item">
            <p><strong>Program Studi:</strong> {{ $studyProgram->nama_prodi }} ({{ $studyProgram->jenjang }})</p>
            <p><strong>Institusi:</strong> {{ $studyProgram->nama_institusi }}</p>
        </div>
        <div class="metadata-item" style="text-align: right;">
            <p><strong>Tanggal Cetak:</strong> {{ date('d F Y') }}</p>
            <p><strong>Periode Analisis:</strong> {{ date('Y-m') }}</p>
        </div>
    </div>

    <!-- Ringkasan Eksekutif -->
    <div class="section-title">Ringkasan Penyelarasan</div>
    <div class="summary-box">
        <div class="summary-card">
            <h3>{{ $courses->count() }}</h3>
            <p>Total Mata Kuliah</p>
        </div>
        <div class="summary-card">
            <h3>
                @php
                    $criticalCount = $gapAnalyses->where('tipe_mismatch', '!=', 'aligned')->count();
                    $totalCount = $gapAnalyses->count();
                    $matchRate = $totalCount > 0 ? round((($totalCount - $criticalCount) / $totalCount) * 100) : 70;
                @endphp
                {{ $matchRate }}%
            </h3>
            <p>Tingkat Keselarasan</p>
        </div>
        <div class="summary-card">
            <h3>{{ $criticalCount }}</h3>
            <p>Kesenjangan Terdeteksi</p>
        </div>
    </div>

    <!-- Tabel Kesenjangan Keterampilan -->
    <div class="section-title">Hasil Analisis Kesenjangan Keterampilan (Skill Gap Analysis)</div>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Keterampilan / Skill</th>
                <th>Kategori</th>
                <th>Tipe Kesenjangan</th>
                <th>Skor Urgensi</th>
                <th>Match Rate</th>
            </tr>
        </thead>
        <tbody>
            @forelse($gapAnalyses as $index => $gap)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td><strong>{{ $gap->skill->nama }}</strong></td>
                    <td>{{ $gap->skill->kategori }}</td>
                    <td>
                        @if($gap->tipe_mismatch === 'aligned')
                            <span class="badge badge-green">Selaras</span>
                        @elseif($gap->tipe_mismatch === 'under_skill')
                            <span class="badge badge-yellow">Underskilled</span>
                        @else
                            <span class="badge badge-red">Kritis</span>
                        @endif
                    </td>
                    <td>{{ $gap->skor_urgensi }}/10</td>
                    <td>{{ $gap->match_rate }}%</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted);">Tidak ada data kesenjangan keterampilan dalam database.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="page-break"></div>

    <!-- Tabel Master Mata Kuliah -->
    <div class="section-title">Data Kurikulum & Silabus Eksisting (Master Data)</div>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Kode MK</th>
                <th>Nama Mata Kuliah</th>
                <th>SKS</th>
                <th>Semester</th>
                <th>Versi</th>
                <th>Status Verifikasi</th>
            </tr>
        </thead>
        <tbody>
            @forelse($courses as $index => $course)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td style="font-family: monospace;">{{ $course->code }}</td>
                    <td><strong>{{ $course->name }}</strong></td>
                    <td>{{ $course->credits }} SKS</td>
                    <td>Semester {{ $course->semester }}</td>
                    <td>{{ $course->versi }}</td>
                    <td>
                        @if($course->status_verifikasi_ekstraksi)
                            <span class="badge badge-green">Terverifikasi</span>
                        @else
                            <span class="badge badge-yellow">Belum</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted);">Tidak ada mata kuliah kurikulum terdaftar.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Tanda Tangan / Legalisasi -->
    <div class="footer">
        <div>
            <p><em>*Dokumen ini dibuat secara otomatis oleh sistem kurikulum Skill Gap Analyzer.</em></p>
        </div>
        <div class="signature-area">
            <p>Mengetahui,</p>
            <p><strong>Kepala Program Studi</strong></p>
            <div class="signature-line"></div>
            <p>NIP. ....................................</p>
        </div>
    </div>

    <!-- Otomatisasi Cetak -->
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 600);
        };
    </script>
</body>
</html>
