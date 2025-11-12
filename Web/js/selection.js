// 製品選定ツールのJavaScript

// 容量スライダーの更新
document.getElementById('capacityRange').addEventListener('input', function() {
    document.getElementById('capacityValue').textContent = this.value + 'TB';
});

// 診断結果表示
function showResult() {
    // 入力値を取得
    const industry = document.getElementById('industry').value;
    const users = document.querySelector('input[name="users"]:checked')?.value;
    const capacity = parseInt(document.getElementById('capacityRange').value);
    const downtime = document.getElementById('downtime').value;
    const budget = document.querySelector('input[name="budget"]:checked')?.value;
    const network = document.querySelector('input[name="network"]:checked')?.value;
    
    // 用途を取得（複数選択）
    const purposes = [];
    document.querySelectorAll('input[id^="use"]:checked').forEach(cb => {
        purposes.push(cb.value);
    });
    
    // バックアップ要件を取得（複数選択）
    const backupRequirements = [];
    document.querySelectorAll('input[id^="backup"]:checked').forEach(cb => {
        backupRequirements.push(cb.value);
    });

    // バリデーション
    if (!industry || !users || !downtime || !budget || !network) {
        alert('すべての必須項目を選択してください');
        return;
    }

    // 製品選定ロジック
    const recommendation = getRecommendation(users, capacity, budget, downtime, industry, network, purposes, backupRequirements);
    
    // 結果を表示
    displayResult(recommendation);
    
    // 結果エリアを表示してスクロール
    document.getElementById('resultArea').style.display = 'block';
    document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 製品選定ロジック
function getRecommendation(users, capacity, budget, downtime, industry, network, purposes, backupRequirements) {
    let product = {};
    
    // 10GbE必須の場合
    if (network === '10gbe' || purposes.includes('video') || (industry === 'creative' && capacity > 20)) {
        if (budget === '300+' || users === '50+') {
            product = {
                model: 'TS-H1277AFX',
                name: 'QNAP TS-H1277AFX',
                price: '¥2,349,600～',
                capacity: '120TB (12TB×12, RAID 6)',
                specs: {
                    bays: '12ベイ',
                    network: '10GBASE-T×2',
                    cpu: 'Ryzen 7 9000 8コア',
                    ram: '32GB（最大64GB）'
                },
                maintenance: '24h365d オンサイト保守推奨',
                maintenancePrice: '¥471,900',
                total: '¥3,500,000前後',
                reasons: [
                    '10GbE対応で超高速ファイル転送',
                    'Ryzen 8コアCPUで4K/8K動画編集に最適',
                    '大規模企業向け最高性能モデル',
                    '12ベイで大容量データに対応'
                ]
            };
        } else {
            product = {
                model: 'TS-432PXU',
                name: 'QNAP TS-432PXU',
                price: '¥347,600～',
                capacity: '32TB (8TB×4, RAID 5)',
                specs: {
                    bays: '4ベイ',
                    network: '10GbE SFP+×2',
                    cpu: 'Alpine デュアルコア',
                    ram: '2GB（拡張可能）'
                },
                maintenance: 'センドバック保守 5年推奨',
                maintenancePrice: '¥132,000',
                total: '¥660,000前後（10GbE NIC含む）',
                reasons: [
                    '10GbE対応で超高速ファイル転送',
                    '動画編集・CADデータに最適',
                    '複数人の同時アクセスでも快適',
                    'コストパフォーマンスに優れた10GbEモデル'
                ]
            };
        }
    }
    // 監視カメラ・セキュリティ業種
    else if (industry === 'surveillance' || purposes.includes('surveillance')) {
        product = {
            model: 'TS-h765eU',
            name: 'QNAP TS-h765eU（WD Purple構成）',
            price: '¥450,000～',
            capacity: '12TB (WD Purple 4TB×4, RAID 5)',
            specs: {
                bays: '4ベイ',
                network: '2.5GbE×2',
                cpu: '高性能プロセッサ',
                ram: '8GB'
            },
            maintenance: 'センドバック保守 5年推奨',
            maintenancePrice: '¥165,000',
            total: '¥620,000～670,000',
            reasons: [
                'WD Purple（監視カメラ専用HDD、180万時間MTBF）',
                'QVR Pro（NVR機能）で最大64ch対応',
                '24時間連続書き込み対応',
                'AIイベント検知、顔認識機能'
            ]
        };
    }
    // ランサムウェア対策・BCP対策必須
    else if (purposes.includes('ransomware') || purposes.includes('bcp') || industry === 'medical' || industry === 'government') {
        product = {
            model: 'TS-h765eU',
            name: 'QNAP TS-h765eU（ニアライン×2台構成）',
            price: '¥1,474,000～',
            capacity: '48TB (12TB×4, RAID 6) × 2台',
            specs: {
                bays: '4ベイ × 2台',
                network: '2.5GbE×2',
                cpu: '高性能プロセッサ',
                ram: '8GB'
            },
            maintenance: 'オンサイト保守 5年推奨',
            maintenancePrice: '¥445,500',
            total: '¥1,920,000前後',
            reasons: [
                'ニアラインHDD（5年保証、高信頼性）',
                '本番+バックアップの2台構成でランサムウェア対策',
                'オフラインバックアップで3-2-1ルール遵守',
                'RAID 6で2台同時故障にも対応',
                '医療・官公庁に最適な高信頼性構成'
            ]
        };
    }
    // 仮想化環境バックアップ
    else if (purposes.includes('virtualization')) {
        product = {
            model: 'TS-h765eU',
            name: 'QNAP TS-h765eU',
            price: '¥596,200～',
            capacity: '40TB (10TB×4, RAID 6)',
            specs: {
                bays: '4ベイ',
                network: '2.5GbE×2',
                cpu: '高性能プロセッサ',
                ram: '8GB（拡張可能）'
            },
            maintenance: 'オンサイト保守 5年推奨',
            maintenancePrice: '¥280,500',
            total: '¥880,000前後',
            reasons: [
                'VMware vSphere、Hyper-V対応',
                '8GB RAMで仮想マシンバックアップに最適',
                'スナップショット機能で世代管理',
                '高速復元機能で業務継続性を確保'
            ]
        };
    }
    // 小規模・低予算
    else if (users === '1-5' && budget === '0-30') {
        product = {
            model: 'TS-233',
            name: 'QNAP TS-233',
            price: '¥89,760～',
            capacity: '4TB (2TB×2, RAID 1)',
            specs: {
                bays: '2ベイ',
                network: '1GbE×1',
                cpu: 'Cortex-A55 クアッドコア',
                ram: '2GB'
            },
            maintenance: '延長保証 2年推奨',
            maintenancePrice: '¥8,360',
            total: '¥150,000前後',
            reasons: [
                '小規模オフィスに最適なコストパフォーマンス',
                'シンプルなRAID 1構成で信頼性確保',
                '導入・運用コストが低い',
                'クラウド連携も可能'
            ]
        };
    }
    // 中小企業標準構成
    else if ((users === '5-20' || users === '1-5') && (budget === '30-80' || network === '2.5gbe')) {
        product = {
            model: 'TS-433eU',
            name: 'QNAP TS-433eU',
            price: '¥257,400～',
            capacity: '24TB (8TB×4, RAID 5)',
            specs: {
                bays: '4ベイ',
                network: '2.5GbE×2',
                cpu: 'Cortex-A55 クアッドコア',
                ram: '4GB'
            },
            maintenance: 'センドバック保守 5年推奨',
            maintenancePrice: '¥101,200',
            total: '¥555,000前後',
            reasons: [
                '中小企業に最適なバランス型モデル',
                '2.5GbE対応で高速ファイル転送',
                'RAID 5で容量と信頼性のバランスが良好',
                '4ベイで将来の容量拡張が容易'
            ]
        };
    }
    // 中堅企業・高性能構成
    else if (users === '20-50' || (budget === '80-300' && capacity > 20)) {
        product = {
            model: 'TS-h765eU',
            name: 'QNAP TS-h765eU',
            price: '¥312,400～',
            capacity: '32TB (8TB×4, RAID 6)',
            specs: {
                bays: '4ベイ',
                network: '2.5GbE×2',
                cpu: '高性能プロセッサ',
                ram: '8GB（拡張可能）'
            },
            maintenance: 'オンサイト保守 5年推奨',
            maintenancePrice: '¥280,500',
            total: '¥730,000前後',
            reasons: [
                '中堅企業向けの高性能モデル',
                '8GB RAMで仮想化にも対応',
                'RAID 6で2台同時故障にも対応',
                'オンサイト保守で安心運用'
            ]
        };
    }
    // 大規模・エンタープライズ
    else if (users === '50+' || budget === '300+') {
        product = {
            model: 'TS-H1277AFX',
            name: 'QNAP TS-H1277AFX',
            price: '¥2,349,600～',
            capacity: '120TB (12TB×12, RAID 6)',
            specs: {
                bays: '12ベイ',
                network: '10GBASE-T×2',
                cpu: 'Ryzen 7 9000 8コア',
                ram: '32GB（最大64GB）'
            },
            maintenance: '24h365d オンサイト保守推奨',
            maintenancePrice: '¥471,900',
            total: '¥3,500,000前後',
            reasons: [
                '大規模企業向け最高性能モデル',
                'Ryzen 8コアCPUで高い処理能力',
                '12ベイで大容量データに対応',
                'PCIe拡張スロット×3で高い拡張性',
                '24時間365日の保守で安心'
            ]
        };
    }
    // デフォルト（TS-433eU）
    else {
        product = {
            model: 'TS-433eU',
            name: 'QNAP TS-433eU',
            price: '¥257,400～',
            capacity: '24TB (8TB×4, RAID 5)',
            specs: {
                bays: '4ベイ',
                network: '2.5GbE×2',
                cpu: 'Cortex-A55 クアッドコア',
                ram: '4GB'
            },
            maintenance: 'センドバック保守 5年推奨',
            maintenancePrice: '¥101,200',
            total: '¥555,000前後',
            reasons: [
                '多くの企業に適したバランス型モデル',
                '2.5GbE対応で高速転送',
                'コストパフォーマンスに優れる'
            ]
        };
    }

    // 業種別の追加推奨事項
    if (industry === 'medical') {
        product.additionalNotes = [
            '医療機関向け推奨: ニアラインHDD（5年保証）を選択',
            'バックアップNASの追加導入を推奨（ランサムウェア対策）',
            'RAID 6構成で高い冗長性を確保',
            '暗号化機能で個人情報保護'
        ];
    } else if (industry === 'manufacturing') {
        product.additionalNotes = [
            '製造業向け推奨: 24時間稼働対応のエンタープライズHDD',
            '10GbE環境の整備を推奨（IoTデータ収集）',
            'UPSの導入必須',
            '生産データのリアルタイムバックアップ'
        ];
    } else if (industry === 'government') {
        product.additionalNotes = [
            '官公庁向け推奨: ニアラインHDD（長期保存対応）',
            '遠隔地バックアップでBCP対策必須',
            '公文書管理法対応の構成',
            '情報公開請求対応の全文検索機能'
        ];
    } else if (industry === 'retail') {
        product.additionalNotes = [
            '流通業向け推奨: 本部+各店舗の階層構成',
            '夜間自動同期でリアルタイム在庫管理',
            'POSデータの集約・分析',
            '営業時間中の安定稼働を重視'
        ];
    } else if (industry === 'it') {
        product.additionalNotes = [
            'IT開発向け推奨: SSDキャッシュ追加',
            'Docker、仮想マシン実行対応',
            'Git リポジトリ、ビルド環境の高速化',
            'スナップショット機能で開発環境の保護'
        ];
    } else if (purposes.includes('cloud')) {
        if (!product.additionalNotes) product.additionalNotes = [];
        product.additionalNotes.push('Box、OneDrive、Google Drive連携可能');
    }

    // バックアップ要件の処理
    if (backupRequirements && backupRequirements.length > 0) {
        if (!product.additionalNotes) product.additionalNotes = [];
        
        if (backupRequirements.includes('nas_to_nas')) {
            product.additionalNotes.push('【NAS to NAS】バックアップ用に2台目のNASを推奨（3-2-1ルール対応）');
            product.additionalNotes.push('  ➜ 同一モデルをもう1台導入し、RTRR（リアルタイムリモートレプリケーション）で自動バックアップ');
            product.additionalNotes.push('  ➜ 推定追加費用: ' + product.price);
        }
        
        if (backupRequirements.includes('cloud')) {
            product.additionalNotes.push('【クラウドバックアップ】HBS 3（Hybrid Backup Sync）で自動クラウドバックアップ');
            product.additionalNotes.push('  ➜ 対応クラウド: AWS S3、Azure Blob、Google Cloud Storage、Backblaze B2等');
            product.additionalNotes.push('  ➜ ランサムウェア対策として重要なオフサイトバックアップ');
        }
        
        if (backupRequirements.includes('external_hdd')) {
            product.additionalNotes.push('【外付けHDD】USB 3.2接続の外付けHDDで定期バックアップ（週次・月次）');
            product.additionalNotes.push('  ➜ 推奨容量: NAS容量と同等以上（' + (parseInt(product.capacity) || '32') + 'TB程度）');
            product.additionalNotes.push('  ➜ オフライン保管でランサムウェア対策に有効');
            product.additionalNotes.push('  ➜ USB 3.2 Gen2ポート利用で高速バックアップ可能');
        }
        
        // 複数のバックアップ方法が選択されている場合
        if (backupRequirements.length >= 2) {
            product.additionalNotes.push('【データ保護ベストプラクティス】');
            product.additionalNotes.push('  ➜ 3-2-1ルール実現: 3つのコピー、2種類のメディア、1つはオフサイト');
            product.additionalNotes.push('  ➜ ランサムウェア攻撃からの復旧率を大幅に向上');
        }
    }

    return product;
}

// 結果表示
function displayResult(product) {
    const resultHTML = `
        <div class="card border-primary mb-4">
            <div class="card-header bg-primary text-white">
                <h4 class="mb-0">推奨製品</h4>
            </div>
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-4 text-center">
                        <i class="fas fa-server fa-5x text-primary mb-3"></i>
                        <h3>${product.name}</h3>
                        <p class="text-primary fw-bold fs-4">${product.price}</p>
                    </div>
                    <div class="col-md-8">
                        <h5 class="mb-3">推奨構成</h5>
                        <table class="table table-borderless">
                            <tr>
                                <td class="fw-bold"><i class="fas fa-hdd text-primary me-2"></i>容量:</td>
                                <td>${product.capacity}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold"><i class="fas fa-server text-primary me-2"></i>ベイ数:</td>
                                <td>${product.specs.bays}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold"><i class="fas fa-network-wired text-primary me-2"></i>ネットワーク:</td>
                                <td>${product.specs.network}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold"><i class="fas fa-microchip text-primary me-2"></i>CPU:</td>
                                <td>${product.specs.cpu}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold"><i class="fas fa-memory text-primary me-2"></i>RAM:</td>
                                <td>${product.specs.ram}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold"><i class="fas fa-tools text-primary me-2"></i>保守:</td>
                                <td>${product.maintenance} (${product.maintenancePrice})</td>
                            </tr>
                        </table>
                        <div class="alert alert-info">
                            <strong>概算費用:</strong> ${product.total}（本体+保守+導入支援含む）
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card border-success mb-4">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="fas fa-check-circle me-2"></i>この構成を選んだ理由</h5>
            </div>
            <div class="card-body">
                <ul class="list-unstyled mb-0">
                    ${product.reasons.map(reason => `
                        <li class="mb-2">
                            <i class="fas fa-check text-success me-2"></i>${reason}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>

        ${product.additionalNotes ? `
            <div class="card border-warning">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>業種別の追加推奨事項</h5>
                </div>
                <div class="card-body">
                    <ul class="list-unstyled mb-0">
                        ${product.additionalNotes.map(note => `
                            <li class="mb-2">
                                <i class="fas fa-info-circle text-warning me-2"></i>${note}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        ` : ''}
    `;

    document.getElementById('resultContent').innerHTML = resultHTML;
    
    // 結果をローカルストレージに保存（見積もりページで使用）
    try {
        localStorage.setItem('selectedProduct', JSON.stringify(product));
        console.log('診断結果を保存しました:', product);
    } catch (e) {
        console.error('ローカルストレージへの保存に失敗しました:', e);
    }
}

// フォームのリセット
function resetForm() {
    // フォームをリセット
    document.getElementById('industry').value = '';
    document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
    document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
    document.getElementById('capacityRange').value = 10;
    document.getElementById('capacityValue').textContent = '10TB';
    document.getElementById('downtime').value = '';
    
    // 結果エリアを非表示
    document.getElementById('resultArea').style.display = 'none';
    
    // トップへスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 見積もり作成ページへ遷移
function proceedToEstimate() {
    // 診断結果がローカルストレージに保存されていることを確認
    const savedProduct = localStorage.getItem('selectedProduct');
    
    if (savedProduct) {
        // 見積もりページへ遷移
        window.location.href = 'estimate.html';
    } else {
        alert('診断結果の保存に失敗しました。もう一度診断を実行してください。');
    }
}
