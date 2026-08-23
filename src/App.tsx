import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";

const problemCards = [
    ["01", "합격자와 내 풀이가 다른 것 같은데,\n정확히 뭐가 다른지 모르겠어요"],
    ["02", "혼자서는 정체 원인을 못 찾겠어서,\n결국 사람을 찾게 돼요"],
    ["03", "양치기만 하는 것 같은데,\n이게 맞는 방법인지 모르겠어요"],
    ["04", "자료해석이 유독 안 올라요.\n시간 배분이 안 돼요."],
    ["05", "성적이 예측이 안 돼요.\n'감'으로만 푸는 것 같아요"]
];

const solutionCards = [
    ["01", "합격자 풀이 전략 이식", "합격자의 시선 경로로 무엇에 집중하는지를\n파악하고, 내 전략으로 가져와요"],
    ["02", "나 vs 합격자 시선 비교", "나와 합격자의 풀이를 비교해서\n무엇이 어떻게 다른지를 시각화해서 보여줘요"],
    ["03", "실전 적용", "이 순서가 왜 유리한지 설명하고,\n시험장에서 재현 가능한 풀이 루틴을 드려요"]
];

const processCards = [
    ["01", "문제 풀이", "문제를 읽고 판단하는 동안\nTPIS가 시선의 이동 순서와\n머문 구간을 기록합니다"],
    ["02", "합격자 풀이 비교", "나와 고득점자의 \n풀이 방식을\n한 화면에서 비교합니다"],
    ["03", "시선 훈련", "‘어떤 순서로 봐야 하는지’를\n풀이 루틴으로 바꿔 적용합니다"]
];

type GazeMode = "mine" | "high";
type HeroVisualMode = "constellation" | "card";
type ReferenceMode = "before" | "after";
type GazePoint = { x: number; y: number; size: number };

const referencePanels: Record<ReferenceMode, { label: string; caption: string; image: string; alt: string }> = {
    before: {
        label: "사용 전",
        caption: "합격자와 문제 풀이 전략 일치도 ‘낮음’",
        image: "/assets/before-usage.png",
        alt: "TPIS 사용 전 시선 분석 화면"
    },
    after: {
        label: "사용 후",
        caption: "합격자와 문제 풀이 전략 일치도 ‘매우 높음’",
        image: "/assets/after-usage.png",
        alt: "TPIS 사용 후 시선 분석 화면"
    }
};

const myPreviewPath: GazePoint[] = [
    { x: 20, y: 25, size: 17 },
    { x: 58, y: 27, size: 22 },
    { x: 18, y: 49, size: 18 },
    { x: 50, y: 58, size: 20 },
    { x: 69, y: 49, size: 25 },
    { x: 28, y: 76, size: 22 },
    { x: 66, y: 79, size: 19 },
    { x: 50, y: 58, size: 28 },
    { x: 27, y: 88, size: 17 }
];

const highPreviewPath: GazePoint[] = [
    { x: 20, y: 25, size: 17 },
    { x: 18, y: 43, size: 17 },
    { x: 50, y: 49, size: 18 },
    { x: 69, y: 49, size: 20 },
    { x: 29, y: 76, size: 22 }
];

const constellationNodes = [
    { id: "bottom", x: 78.2615, y: 259.36, z: 32, r: 15.6522, ax: 19, ay: 15, sx: 1.08, sy: 0.84, phase: 0.2 },
    { id: "main", x: 150.653, y: 57.9976, z: -42, r: 20.8696, ax: 16, ay: 13, sx: 0.92, sy: 1.12, phase: 1.1 },
    { id: "midTop", x: 150.652, y: 102.31, z: 48, r: 10.4348, ax: 14, ay: 17, sx: 1.28, sy: 0.94, phase: 2.2 },
    { id: "center", x: 90.6516, y: 177.903, z: -58, r: 10.4348, ax: 18, ay: 14, sx: 1.02, sy: 1.32, phase: 3 },
    { id: "leftTop", x: 10.4348, y: 20.8531, z: 18, r: 10.4348, ax: 15, ay: 12, sx: 1.18, sy: 0.78, phase: 4.1 },
    { id: "rightTop", x: 218.478, y: 10.4265, z: -50, r: 10.4348, ax: 17, ay: 13, sx: 1.06, sy: 1.04, phase: 5 },
    { id: "left", x: 26.0864, y: 129.028, z: 54, r: 20.8696, ax: 20, ay: 16, sx: 0.88, sy: 1.22, phase: 5.7 },
    { id: "right", x: 229.566, y: 57.9976, z: 28, r: 10.4348, ax: 15, ay: 16, sx: 1.35, sy: 0.86, phase: 6.4 }
];

const constellationLinks = [
    ["main", "midTop"],
    ["left", "main"],
    ["midTop", "center"],
    ["left", "center"],
    ["main", "right"],
    ["center", "bottom"],
    ["main", "leftTop"],
    ["bottom", "rightTop"]
];

function App() {
    const [status, setStatus] = useState("");
    const [isContactOpen, setIsContactOpen] = useState(false);
    const floatingContactRef = useRef<HTMLDivElement>(null);
    const contactScriptUrl = import.meta.env.VITE_CONTACT_SCRIPT_URL ?? "";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (!contactScriptUrl) {
            setStatus("Google Apps Script 웹앱 URL을 .env에 입력하면 문의 전송이 활성화됩니다.");
            return;
        }

        try {
            setStatus("문의 내용을 전송하는 중입니다.");
            await fetch(contactScriptUrl, {
                method: "POST",
                mode: "no-cors",
                body: new FormData(form)
            });
            form.reset();
            setStatus("문의가 접수되었습니다. 빠르게 연락드리겠습니다.");
        } catch {
            setStatus("전송 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }
    };

    const openContactBubble = () => {
        setIsContactOpen(true);

        window.setTimeout(() => {
            floatingContactRef.current?.querySelector<HTMLInputElement>("input")?.focus();
        }, 60);
    };

    useEffect(() => {
        if (!isContactOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsContactOpen(false);
            }
        };

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (!floatingContactRef.current?.contains(target)) {
                setIsContactOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("pointerdown", handlePointerDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [isContactOpen]);

    return (
        <main className="landing">
            <header className="site-header">
                <a className="brand" href="#top">TPIS</a>
                <button className="header-cta" type="button" onClick={openContactBubble}>무료 진단하기</button>
            </header>

            <section className="hero section-blue" id="top">
                <HeroVisual />
                <div className="floating-contact" ref={floatingContactRef}>
                    {isContactOpen && (
                        <div className="contact-bubble" role="dialog" aria-label="무료 진단 문의하기">
                            <button className="contact-bubble__close" type="button" aria-label="문의 폼 닫기" onClick={() => setIsContactOpen(false)}>×</button>
                            <ContactForm status={status} onSubmit={handleSubmit} />
                        </div>
                    )}
                    <button className="floating-cta" type="button" aria-expanded={isContactOpen} onClick={openContactBubble}>무료 진단하기</button>
                </div>
            </section>

            <section className="problem section-soft">
                <SectionHeading eyebrow="Problem" title={<>문제를 많이 풀어도<br />성적이 안 오르나요?</>} />
                <div className="problem-grid">
                    {problemCards.map(([number, text], index) => (
                        <article className={`tilt-card tilt-${index + 1}`} key={number}>
                            <Badge>{number}</Badge>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
                <div className="down-arrow" aria-hidden="true"></div>
                <p className="section-punch">그 이유는 문제풀이량이 아니라,<br /><strong>문제를 보는 순서</strong>일 수도 있습니다</p>
            </section>

            <section className="why section-muted">
                <SectionHeading eyebrow="Why TPIS" title={<>합격자의 시선에는<br />이유가 있습니다.</>} />
                <div className="why-animation">
                    <img src="/assets/landing-animation.gif" alt="TPIS 시선 패턴 분석 애니메이션" />
                </div>
                <p className="section-punch">TPIS는 인지 처리 과정을 시각화하여,<br /><strong>‘시선 패턴’</strong>으로 합격의 해답을 제시합니다.</p>
            </section>

            <section className="solution section-gradient">
                <SectionHeading eyebrow="Solution" title={<>TPIS로 합격자의 풀이를<br />나에게 이식하세요</>} />
                <div className="solution-layout">
                    <div className="solution-media">
                        <img className="solution-image" src="/assets/solution-view.png" alt="TPIS 분석 화면" />
                        <p className="solution-caption">
                            <span className="solution-caption-desktop">왜 그렇게 보는지, 시험장에서 어떻게 쓰는지까지 해결합니다</span>
                            <span className="solution-caption-mobile">왜 그렇게 보는지,<br />시험장에서 어떻게 쓰는지까지<br />TPIS로 한 번에</span>
                        </p>
                    </div>
                    <div className="solution-list">
                        {solutionCards.map(([number, title, text]) => (
                            <article className="info-card" key={title}>
                                <Badge>{number}</Badge>
                                <div>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="reference section-white">
                <SectionHeading eyebrow="Reference" title={<>합격자의 눈으로<br />문제를 보는 훈련</>} />
                <div className="reference-layout">
                    <ComparisonPanel title="TPIS 사용 전" caption="합격자와 문제 풀이 전략 일치도 ‘낮음’" image="/assets/before-usage.png" />
                    <div className="desktop-arrow" aria-hidden="true"></div>
                    <ComparisonPanel title="TPIS 사용 2달 후" caption="합격자와 문제 풀이 전략 일치도 ‘매우 높음’" image="/assets/after-usage.png" />
                </div>
                <ReferenceToggle />
            </section>

            <section className="process section-white">
                <SectionHeading eyebrow="How it works" title={<>내 풀이 습관이 바뀔 때까지<br />TPIS와 함께 하세요</>} />
                <div className="process-grid">
                    {processCards.map(([number, title, text]) => (
                        <article className="process-card" key={title}>
                            <div className="process-title">
                                <Badge>{number}</Badge>
                                <h3>{title}</h3>
                            </div>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
            </section>
            <section className="bottom-cta section-blue">
                <div className="bottom-cta__constellation" aria-hidden="true">
                    <HeroConstellation className="hero-constellation--cta" />
                </div>
                <p>합격으로 가는 가장 빠른 길</p>
                <h2>합격자의 문제 풀이 방식을<br />먼저 확인해보세요</h2>
                <button type="button" onClick={openContactBubble}>무료 진단하기</button>
            </section>

            <footer className="footer">
                <div>
                    <strong>TPIS</strong>
                    <span>Third-Person to In-Sight</span>
                    <p>합격자 문제풀이 전략 훈련 솔루션</p>
                </div>
                <div>
                    <span>Business info</span>
                    <p>(주)라파(LAPA)<br />CEO Il Hyun Jo</p>
                </div>
                <small>© 2026 LAPA. All rights reserved.</small>
            </footer>
        </main>
    );
}

function ContactForm({ onSubmit, status }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; status: string }) {
    return (
        <form className="contact-form contact-form--bubble" onSubmit={onSubmit}>
            <div className="contact-form__head">
                <p className="eyebrow left">무료 진단</p>
                <h2>문의하기</h2>
                <span>남겨주신 정보로 진단 가능 일정과 준비사항을 안내드립니다.</span>
            </div>
            <label>
                <span>이름</span>
                <input name="name" placeholder="홍길동" required />
            </label>
            <label>
                <span>연락처 또는 이메일</span>
                <input name="contact" placeholder="010-0000-0000 또는 email@example.com" required />
            </label>
            <label>
                <span>궁금한 점</span>
                <textarea name="message" placeholder="현재 고민 중인 과목이나 풀이 상황을 적어주세요" rows={4}></textarea>
            </label>
            <button type="submit">문의하기</button>
            {status && <p className="form-status">{status}</p>}
        </form>
    );
}

function HeroVisual() {
    const [mode, setMode] = useState<HeroVisualMode>("constellation");
    const [isHovering, setIsHovering] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const visualRef = useRef<HTMLDivElement>(null);
    const remainingMs = useRef(10000);
    const isPaused = isHovering || isFocused;

    useEffect(() => {
        if (isPaused) {
            return;
        }

        const startedAt = performance.now();
        let completed = false;
        const timer = window.setTimeout(() => {
            completed = true;
            remainingMs.current = 10000;
            setMode((current) => current === "constellation" ? "card" : "constellation");
        }, remainingMs.current);

        return () => {
            window.clearTimeout(timer);

            if (!completed) {
                remainingMs.current = Math.max(0, remainingMs.current - (performance.now() - startedAt));
            }
        };
    }, [isPaused, mode]);

    return (
        <div
            className={`hero-visual hero-visual--${mode}`}
            ref={visualRef}
            aria-label="TPIS 시선 비교 미리보기"
            onPointerEnter={() => setIsHovering(true)}
            onPointerLeave={() => setIsHovering(false)}
            onFocusCapture={() => setIsFocused(true)}
            onBlurCapture={(event) => {
                if (!visualRef.current?.contains(event.relatedTarget as Node | null)) {
                    setIsFocused(false);
                }
            }}
        >
            <div className="hero-constellation-panel" aria-hidden={mode !== "constellation"}>
                <div className="hero-copy">
                    <p className="hero-kicker">PSAT 합격 내비게이션</p>
                    <h1>합격자와 나의<br />시선 차이를 분석하다</h1>
                </div>
                <div className="constellation-stage">
                    <HeroConstellation />
                </div>
            </div>
            <div className="hero-card-panel" aria-hidden={mode !== "card"}>
                <div className="glass-preview">
                    <HeroDemoWindow isActive={mode === "card"} />
                </div>
            </div>
        </div>
    );
}

function ReferenceToggle() {
    const [mode, setMode] = useState<ReferenceMode>("before");
    const selectedPanel = referencePanels[mode];

    return (
        <div className="reference-toggle">
            <div className="reference-tabs" role="tablist" aria-label="TPIS 사용 전후 사진 전환">
                {(Object.keys(referencePanels) as ReferenceMode[]).map((key) => (
                    <button
                        className={mode === key ? "is-active" : ""}
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={mode === key}
                        onClick={() => setMode(key)}
                    >
                        {referencePanels[key].label}
                    </button>
                ))}
            </div>
            <p className="reference-caption">{selectedPanel.caption}</p>
            <img className="reference-image" key={mode} src={selectedPanel.image} alt={selectedPanel.alt} />
        </div>
    );
}

function HeroDemoWindow({ isActive }: { isActive: boolean }) {
    const [gazeMode, setGazeMode] = useState<GazeMode>("high");
    const isMine = gazeMode === "mine";

    return (
        <div className="hero-demo-window">
            <div className="hero-demo-window__bar">
                <div><span></span><span></span><span></span></div>
                <strong>같은 문제, 다른 시선</strong>
                <em>LIVE DEMO</em>
            </div>
            <div className="hero-demo-window__tabs">
                <button className={isMine ? "is-active" : ""} type="button" tabIndex={isActive ? 0 : -1} onClick={() => setGazeMode("mine")}>나의 시선</button>
                <button className={!isMine ? "is-active" : ""} type="button" tabIndex={isActive ? 0 : -1} onClick={() => setGazeMode("high")}>고득점자 시선</button>
            </div>
            <HeroQuestionMock mode={gazeMode} />
            <div className="hero-demo-window__result">
                <div>
                    <small>{isMine ? "나의 풀이" : "고득점자 풀이"}</small>
                    <strong>{isMine ? "재확인 4회" : "핵심 구간 4단계"}</strong>
                </div>
                <p>{isMine ? "지문과 표를 여러 번 왕복하며 판단 시점이 늦어집니다." : "조건 → 표 → 선택지 순서로 필요한 정보만 빠르게 확인합니다."}</p>
            </div>
        </div>
    );
}

function HeroQuestionMock({ mode }: { mode: GazeMode }) {
    const path = mode === "mine" ? myPreviewPath : highPreviewPath;
    const line = path.map((point) => `${point.x},${point.y}`).join(" ");

    return (
        <div className={`hero-question-card hero-question-card--${mode}`}>
            <div className="hero-question-card__topline">
                <span>자료해석 연습문제</span>
                <span>01</span>
            </div>
            <p className="hero-question-card__prompt">다음 자료를 바탕으로 판단할 수 있는 내용으로 가장 적절한 것을 고르시오.</p>
            <div className="hero-question-card__table">
                <div className="hero-table-row hero-table-row--head"><span>구분</span><span>2024</span><span>2025</span><span>증감</span></div>
                <div className="hero-table-row"><span>A</span><span>118</span><span>146</span><span>+28</span></div>
                <div className="hero-table-row"><span>B</span><span>96</span><span>103</span><span>+7</span></div>
                <div className="hero-table-row"><span>C</span><span>74</span><span>91</span><span>+17</span></div>
            </div>
            <div className="hero-question-card__choices">
                <span>① A의 증가폭이 가장 크다.</span>
                <span>② B의 증가율이 가장 높다.</span>
                <span>③ C는 전년 대비 감소했다.</span>
            </div>
            <svg className="hero-eye-path" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points={line} />
                {path.map((point, index) => (
                    <g key={`${point.x}-${point.y}-${index}`}>
                        <circle cx={point.x} cy={point.y} r={point.size / 18} />
                        <text x={point.x} y={point.y + 1.3}>{index + 1}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

function HeroConstellation({ className = "" }: { className?: string }) {
    const lineRefs = useRef<SVGLineElement[]>([]);
    const dotRefs = useRef<SVGCircleElement[]>([]);

    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const centerX = 120;
        const centerY = 137.5;
        const tilt = -23.5 * Math.PI / 180;
        const cosTilt = Math.cos(tilt);
        const sinTilt = Math.sin(tilt);
        let frame = 0;

        const drift = (node: typeof constellationNodes[number], time: number) => {
            if (reduced) {
                return { x: node.x, y: node.y };
            }

            const t = time * 0.001;
            const x = node.x + Math.sin(t * node.sx + node.phase) * node.ax + Math.sin(t * 0.62 + node.phase * 1.7) * 5.5;
            const y = node.y + Math.cos(t * node.sy + node.phase * 0.8) * node.ay + Math.sin(t * 0.74 + node.phase) * 4.8;

            return { x, y };
        };

        const project = (node: typeof constellationNodes[number], time: number) => {
            const angle = reduced ? 0.35 : time * 0.00042;
            const moved = drift(node, time);
            const x = moved.x - centerX;
            const y = moved.y - centerY;
            const movingDepth = node.z + Math.sin(time * 0.0009 + node.phase) * 14;
            const rotatedX = x * Math.cos(angle) + movingDepth * Math.sin(angle);
            const z = -x * Math.sin(angle) + movingDepth * Math.cos(angle);
            const perspective = Math.min(1.36, Math.max(0.64, 380 / (380 + z)));
            const screenX = centerX + (rotatedX * cosTilt - y * sinTilt) * perspective;
            const screenY = centerY + (rotatedX * sinTilt + y * cosTilt) * perspective;

            return { x: screenX, y: screenY, scale: perspective, z };
        };

        const draw = (time = 0) => {
            const points = new Map(constellationNodes.map((node) => [node.id, project(node, time)]));

            constellationLinks.forEach(([from, to], index) => {
                const line = lineRefs.current[index];
                const start = points.get(from);
                const end = points.get(to);

                if (!line || !start || !end) {
                    return;
                }

                line.setAttribute("x1", start.x.toFixed(2));
                line.setAttribute("y1", start.y.toFixed(2));
                line.setAttribute("x2", end.x.toFixed(2));
                line.setAttribute("y2", end.y.toFixed(2));
                line.style.strokeWidth = ((start.scale + end.scale) * 0.5).toFixed(2);
            });

            constellationNodes.forEach((node, index) => {
                const dot = dotRefs.current[index];
                const point = points.get(node.id);

                if (!dot || !point) {
                    return;
                }

                dot.setAttribute("cx", point.x.toFixed(2));
                dot.setAttribute("cy", point.y.toFixed(2));
                dot.setAttribute("r", (node.r * point.scale).toFixed(2));
            });

            if (!reduced) {
                frame = window.requestAnimationFrame(draw);
            }
        };

        draw();

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <svg className={`hero-constellation ${className}`} viewBox="-75 -70 380 410">
            <g>
                {constellationLinks.map(([from, to], index) => (
                    <line
                        className="hero-constellation-line"
                        key={`${from}-${to}`}
                        ref={(element) => {
                            if (element) {
                                lineRefs.current[index] = element;
                            }
                        }}
                    />
                ))}
            </g>
            <g>
                {constellationNodes.map((node, index) => (
                    <circle
                        className="hero-constellation-dot"
                        key={node.id}
                        ref={(element) => {
                            if (element) {
                                dotRefs.current[index] = element;
                            }
                        }}
                    />
                ))}
            </g>
        </svg>
    );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: ReactNode }) {
    return (
        <div className="section-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
        </div>
    );
}

function Badge({ children }: { children: ReactNode }) {
    return <span className="badge">{children}</span>;
}

function ComparisonPanel({ title, caption, image }: { title: string; caption: string; image: string }) {
    return (
        <article className="comparison-panel">
            <h3>{title}</h3>
            <p>{caption}</p>
            <img src={image} alt={`${title} 화면`} />
        </article>
    );
}

export default App;
