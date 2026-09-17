const CORRECT = 'a';

const prizes = [
    { rank: 'A', name: '大吉：50%OFFクーポン', code: 'RINTANU-50OFF', rate: 5 },
    { rank: 'B', name: '中吉：10%OFFクーポン', code: 'RINTANU-10OFF', rate: 20 },
    { rank: 'C', name: '小吉：500円OFFクーポン', code: 'RINTANU-500', rate: 35 },
    { rank: 'D', name: '吉：健康豆知識カード<br>プレゼント！', code: 'HEALTH-TIPS', rate: 40 }
];

let played = false;
let tapReady = false;
let pendingResolve = null;

const $ = id => document.getElementById(id);

function selected() {
    const s = document.querySelector('input[name="answer"]:checked');
    return s ? s.value : null;
}

function valid(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function draw() {
    const t = prizes.reduce((a, p) => a + p.rate, 0);
    let r = Math.random() * t;

    for (const p of prizes) {
        r -= p.rate;
        if (r <= 0) return p;
    }

    return prizes[3];
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function closeStage() {
    document.body.style.overflow = '';

    $('omikujiApp').classList.remove('show', 'action-open');
    $('bigScene').classList.remove('shake');
    $('omikujiSlip').classList.remove('go');

    $('countBig').textContent = '';

    tapReady = false;
    pendingResolve = null;
}

async function playStage() {
    document.body.style.overflow = 'hidden';

    $('omikujiApp').classList.add('show');
    $('stageMessage').classList.remove('tap-ready');
    $('stageMessage').textContent = 'おみくじをふっています...';
    $('countBig').textContent = '';

    $('bigScene').classList.add('shake');

    await sleep(1900);

    $('bigScene').classList.remove('shake');

    $('stageMessage').textContent = 'タップで開運';
    $('stageMessage').classList.add('tap-ready');

    tapReady = true;

    await new Promise(resolve => {
        pendingResolve = resolve;
    });

    tapReady = false;

    $('stageMessage').classList.remove('tap-ready');
    $('stageMessage').textContent = '';
    $('countBig').textContent = '';

    $('omikujiApp').classList.add('action-open');

    $('omikujiSlip').classList.remove('go');
    void $('omikujiSlip').offsetWidth;
    $('omikujiSlip').classList.add('go');

    await sleep(1450);

    $('omikujiApp').classList.remove('action-open');

    closeStage();
}

function showScrollReveal(resultName) {
    const layer = $('scrollRevealLayer');

    if (!layer) return;

    const text = $('scrollResultText');

    if (text) {
        text.textContent = resultName;
    }

    layer.classList.remove('show');
    void layer.offsetWidth;
    layer.classList.add('show');

    setTimeout(() => layer.classList.remove('show'), 3400);
}

function showPrize(p) {
    const resultName = p.name.split('：')[0];
    const prizeName = p.name.split('：')[1];

    $('cta').classList.remove('show');

    $('resultBox').className = 'result show final-scroll-result';

    $('resultBox').innerHTML =
        '<div class="final-scroll-card">' +
        '<div class="final-scroll-rod final-rod-left"></div>' +
        '<div class="final-scroll-paper">' +
        '<div class="final-scroll-label">おみくじ結果</div>' +
        '<div class="final-scroll-fortune">' + resultName + '</div>' +
        '<div class="final-scroll-prize">' + prizeName + '</div>' +
        '<div class="final-scroll-code-label">クーポンコード</div>' +
        '<div class="final-scroll-code">' + p.code + '</div>' +
        '</div>' +
        '<div class="final-scroll-rod final-rod-right"></div>' +
        '</div>';

    showScrollReveal(resultName);

    setTimeout(() => {
        $('resultBox').scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, 3600);

    setTimeout(() => {
        $('cta').classList.add('show');
    }, 6500);
}

document.addEventListener('click', async e => {

    if (e.target.classList.contains('go')) {
        location.href = e.target.dataset.url;
        return;
    }

    if (
        $('omikujiApp').classList.contains('show') &&
        tapReady &&
        e.target.id !== 'closeOmikuji'
    ) {
        if (pendingResolve) pendingResolve();

        pendingResolve = null;

        return;
    }

    const id = e.target.id;

    if (id === 'closeOmikuji') {
        closeStage();
        return;
    }

    if (id === 'resetDemo') {
        localStorage.clear();
        location.reload();
        return;
    }

    if (id === 'submit') {

        const email = $('email').value.trim();
        const ans = selected();

        if (!valid(email)) {
            alert('メールアドレスを入力してください。');
            return;
        }

        if (!ans) {
            alert('回答を選択してください。');
            return;
        }

        const ok = ans === CORRECT;

        $('quizResult').className = 'result show';

        $('quizResult').innerHTML =
            '<div class="quiz-answer-status ' + (ok ? 'correct' : 'incorrect') + '">' +
            (ok ? '正解！' : '不正解') +
            '</div>' +
            '<b>ご参加ありがとうございます！</b>' +
            (
                ok
                    ? '<div class="omikuji-eligible-callout">' +
                        '<span>おみくじ対象です</span>' +
                        '<strong>下のボタンから<br>おみくじを引くたぬ！</strong>' +
                        '<small>正解者限定のおみくじに進めます</small>' +
                      '</div>'
                    : '<p style="color:#b57b91;font-weight:900">今回は不正解です。</p>'
            );

        if (ok) {
            $('omikuji').style.display = 'flex';

            setTimeout(() => {
                $('omikuji').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 350);
        }

        $('submit').disabled = true;

        return;
    }

    if (id === 'omikuji') {

        if (played) return;

        played = true;

        $('omikuji').disabled = true;

        await playStage();

        showPrize(draw());

        $('omikuji').textContent = 'また来月引きに来てね';
        $('omikuji').classList.add('next-month-button');

        return;
    }

});

(function () {

    let showRight = true;

    function swapPrayerImages() {

        const right = document.querySelector('.prayer-right');
        const left = document.querySelector('.prayer-left');

        if (!right || !left) return;

        right.style.display = showRight ? 'block' : 'none';
        left.style.display = showRight ? 'none' : 'block';

        right.style.opacity = '1';
        left.style.opacity = '1';

        showRight = !showRight;
    }

    swapPrayerImages();

    setInterval(swapPrayerImages, 330);

})();