
      const TOPICS = [
        { key: "ethics", name: "AI Ethics" },
        { key: "alignment", name: "AI Alignment" },
        { key: "safety", name: "AI Safety" },
        { key: "interp", name: "AI Interpretability" },
        { key: "spawns", name: "AI Spawns & Self-Replication" },
        { key: "rogue", name: "AI Going Rogue" },
        { key: "scaling", name: "Scaling Laws & Compute" },
        { key: "llm", name: "How LLMs Work" },
        { key: "reasoning", name: "Reasoning Models & Test-Time Compute" },
        { key: "agents", name: "AI Agents & Autonomy" },
        { key: "alignres", name: "Alignment Research Frontier" },
        { key: "safetyres", name: "Safety Research & Evals" },
        { key: "misalign", name: "Emergent Misalignment & Deception" },
        { key: "philosophy", name: "AI Philosophy & Consciousness" },
        { key: "psychology", name: "AI Psychology & Model Behavior" },
        { key: "bias", name: "AI Bias & Fairness" },
        { key: "security", name: "Jailbreaks, Prompt Injection & AI Security" },
        { key: "society", name: "AI & Society: Deepfakes, Misinformation & Privacy" },
        { key: "governance", name: "AI Governance & Policy" },
        { key: "xrisk", name: "AGI Timelines & the X-Risk Debate" },
        { key: "economy", name: "AI, Jobs & the Economy" },
      ];
      // topic | rank | title | channel | id | uploaded | views | length | simplicity | depth | why
      const RAW = [
        ["ethics", 1, "AI Is Dangerous, but Not for the Reasons You Think", "TED (Sasha Luccioni)", "eXdVDhOGqoE", "Nov 6, 2023", "2,099,750", "10:18", 9, 6, "Harms happening now — carbon cost, copyright, bias — each with real numbers and a practical tool."],
        ["ethics", 2, "Anthropic's Chloe Lubinski explains how AI works (in 14 minutes)", "Alliance for Responsible Citizenship", "aBUniZHgCnE", "Jun 24, 2026", "2,951,063", "14:33", 9, 5, "Very plain intro to scaling, neural nets and interpretability; more how-AI-works than ethics."],
        ["ethics", 3, "What Is AI Ethics | How to Implement AI Ethics", "edureka!", "COgvUFGLPCs", "May 8, 2024", "59,071", "9:57", 8, 6, "Textbook style: five pillars with examples, then a company walkthrough."],
        ["ethics", 4, "The Ethics of AI", "World Knowledge Forum (Stuart Russell)", "KiT0T12Yyno", "Jan 4, 2025", "64,965", "31:46", 6, 8, "The deepest: Russell's \u201cprovably beneficial AI\u201d framework. Best second watch."],
        ["ethics", 5, "AI ethics and the future of safety", "TEDx Talks (Roman Yampolskiy)", "VQzK3cPWYTQ", "Sep 1, 2026", "264,330", "14:27", 7, 5, "Easy analogies, but mostly an argument that superintelligence can't be controlled."],
        ["alignment", 1, "The OTHER AI Alignment Problem: Mesa-Optimizers and Inner Alignment", "Robert Miles AI Safety", "bJLcIBixGj8", "Feb 17, 2021", "274,270", "23:23", 8, 10, "Best explainer of all 30: builds from \u201cwhat is an optimizer\u201d to deceptive alignment with great analogies."],
        ["alignment", 2, "The Alignment Problem Explained: Crash Course Futures of AI #4", "CrashCourse", "Sp3aCsQUsDc", "Dec 10, 2025", "34,331", "12:22", 9, 7, "Ideal chaptered primer — watch this first."],
        ["alignment", 3, "AI Alignment - Can We Make AI Safe?", "Isaac Arthur", "eKNbu6pRxjM", "Oct 16, 2025", "40,852", "32:04", 8, 8, "Widest tour of proposed solutions: RLHF, constitutions, interpretability, corrigibility."],
        ["alignment", 4, "How difficult is AI alignment? | Anthropic Research Salon", "Anthropic", "IPmt8b-qLgk", "Jan 8, 2025", "51,001", "28:05", 4, 7, "Real current research from Anthropic researchers, jargon-heavy. Watch after basics."],
        ["alignment", 5, "Scientists Discuss the AI Alignment Problem", "StarTalk", "JRQDc55Aido", "Dec 14, 2024", "319,377", "47:35", 7, 4, "Banter-heavy podcast, little on how alignment works."],
        ["safety", 1, "A reasonable person's guide to how AI destroys humanity | About That", "CBC News", "cPgwnUr1sbE", "Sep 15, 2026", "1,414,371", "13:40", 9, 6, "Each idea gets an analogy, an example, then a real incident. No jargon."],
        ["safety", 2, "What is AI \u201creward hacking\u201d—and why do we worry about it?", "Anthropic", "lvMMZLYoDr4", "Nov 21, 2025", "42,189", "51:57", 5, 9, "Deepest: 9 chapters on the experiment, tests, fixes and limits."],
        ["safety", 3, "The Catastrophic Risks of AI — and a Safer Path", "TED (Yoshua Bengio)", "qe9QSCF-d88", "May 21, 2025", "~735,328", "14:53", 8, 5, "Moving and accessible; persuasive more than explanatory."],
        ["safety", 4, "What This OpenAI Insider Saw That Made Him Quit", "The Ezra Klein Show", "JIMXEuT_ZAU", "Oct 7, 2026", "~470,482", "1:14:55", 6, 5, "Insider account, mostly culture and policy."],
        ["safety", 5, "AI Safety", "Computerphile (Rob Miles)", "IB1OvoCNnWY", "Feb 3, 2016", "~201,576", "~6:00", 6, 3, "Short reply video on why AI timeline predictions are unreliable."],
        ["interp", 1, "Interpretability: Understanding how AI models think", "Anthropic", "fGKNUvivvnc", "Aug 15, 2025", "382,287", "59:02", 8, 8, "Biology and microscope analogies plus many real experiments inside Claude."],
        ["interp", 2, "An Introduction to Mechanistic Interpretability – Neel Nanda | IASEAI 2025", "IASEAI", "0704iLc55Fs", "Aug 12, 2025", "~15,304", "25:12", 8, 7, "Tight slide talk: refusal, clock arithmetic, sparse autoencoders."],
        ["interp", 3, "The Dark Matter of AI [Mechanistic Interpretability]", "Welch Labs", "UGO_Ehywuxc", "Dec 23, 2024", "308,034", "24:09", 6, 10, "Most detailed step-by-step walkthrough through Gemma 2B; needs some linear algebra."],
        ["interp", 4, "Mechanistic Interpretability explained | Chris Olah and Lex Fridman", "Lex Clips", "riniamTdUSo", "Nov 14, 2024", "~30,177", "22:47", 5, 7, "Features, circuits, superposition from the field's founder; unscripted."],
        ["interp", 5, "Reading AI's Mind - Mechanistic Interpretability Explained", "bycloud", "Mhp8vpOksWw", "~Oct 2023", "~21,550", "~9:20", 4, 6, "Jargon-dense and dated."],
        ["spawns", 1, "Recursive Self-Improvement", "Emergent Garden", "t7_ZXgfJVG8", "Jun 13, 2026", "~360K", "31:12", 7, 9, "Clear three-part argument plus a live experiment with real costs, no hype."],
        ["spawns", 2, "As a Microsoft Engineer, This Is the AI Agent Story That Scared Me", "Dave's Garage", "2aw3MF8pY3w", "Sep 15, 2026", "1,057,471", "18:44", 8, 9, "Clear chaptered retelling of the 1,200-agent swarm."],
        ["spawns", 3, "Did Google Researchers Just Create a Self-Replicating Computer Life Form?", "Anton Petrov", "L_IWVZPmc-E", "Jul 16, 2024", "unconfirmed", "~14:00", 8, 7, "Plain-language look at Google's \u201cdigital primordial soup\u201d study."],
        ["spawns", 4, "What You'd Actually See During an AI Takeover", "Species | Documenting AGI", "Gw_hnD7m00M", "Jul 15, 2026", "~2,858,189", "41:03", 9, 4, "Gripping made-up scenario — a story, not an explainer."],
        ["spawns", 5, "AI Just Replicated Itself - Here's What That Means | Warning Shots #41", "The AI Risk Network", "Ia_UKehYysA", "~Jun 1, 2026", "unconfirmed", "~38:30", 5, 3, "Only ~6 minutes on the self-replication study."],
        ["rogue", 1, "GPT-6 Goes Rogue? The HuggingFace Incident, Sans Hype", "AI Explained", "wzY2fV4Mp3U", "Jul 22, 2026", "128,702", "14:35", 7, 9, "Timeline, the actual test prompt, the exploit chain, no hype."],
        ["rogue", 2, "OpenAI Claims Their AI 'Went Rogue'. It Didn't.", "Marcus Hutchins", "GB8gaeI0fLs", "Jul 22, 2026", "~42,000", "18:02", 8, 7, "Security expert's reality check — the opposite view."],
        ["rogue", 3, "Why are AI agents hacking other companies and have they gone rogue?", "BBC Newscast", "6F8F1K4Eahs", "Aug 6, 2026", "~47,000", "27:10", 9, 5, "Easiest overview; AI part is the first ~19 minutes."],
        ["rogue", 4, "Will we be ready when AI goes rogue?", "Washington Week PBS", "3c3xY5rDMgA", "Sep 4, 2026", "~368,155", "16:50", 7, 4, "Hype-heavy, ends with a book plug."],
        ["rogue", 5, "OpenAI says its AI went rogue and launched 'unprecedented' cyber-attack", "BBC News", "4k3RreudH24", "Jul 23, 2026", "unconfirmed", "~9:45", 8, 3, "Headline news report, not an explainer."],
        ["ethics", 6, "Algorithmic Bias and Fairness: Crash Course AI #18", "CrashCourse", "gV0_raKR2UQ", "Dec 14, 2019", "256,529", "11:19", 9, 6, "Structured walkthrough of five common ways bias gets into AI systems, with examples."],
        ["ethics", 7, "How I'm fighting bias in algorithms | Joy Buolamwini", "TED", "UG_X_7g63rY", "Mar 30, 2017", "413,909", "8:44", 9, 5, "Personal, memorable story of face-recognition bias and the 'coded gaze'."],
        ["ethics", 8, "The era of blind faith in big data must end | Cathy O'Neil", "TED", "_2u_eHHzRto", "Sep 7, 2017", "274,454", "13:18", 8, 6, "Sharp argument that algorithms are opinions in code and need auditing."],
        ["ethics", 9, "Machine intelligence makes human morals more important | Zeynep Tufekci", "TED", "hSSmmlridUM", "Nov 11, 2016", "190,363", "17:42", 7, 7, "Thoughtful case that opaque machine-learning decisions demand more human moral judgement."],
        ["ethics", 10, "The Trouble with Bias - NIPS 2017 Keynote - Kate Crawford", "The Artificial Intelligence Channel", "fMym_BKWQzk", "Dec 10, 2017", "77,571", "49:30", 5, 9, "Landmark keynote that reframed AI bias as allocation and representation harms."],
        ["alignment", 6, "Intelligence and Stupidity: The Orthogonality Thesis", "Robert Miles AI Safety", "hEUO6pjwFOo", "Jan 12, 2018", "707,774", "13:02", 8, 8, "Clearest explanation of why smart AI won't automatically have good goals."],
        ["alignment", 7, "Why Would AI Want to do Bad Things? Instrumental Convergence", "Robert Miles AI Safety", "ZeecOKBus3Q", "Mar 25, 2018", "272,990", "10:35", 8, 8, "Explains why almost any goal leads an AI to seek power and resist shutdown."],
        ["alignment", 8, "9 Examples of Specification Gaming", "Robert Miles AI Safety", "nKJlF-olKmg", "Apr 29, 2020", "327,163", "9:39", 9, 6, "Fun, concrete examples of AIs satisfying the letter but not the spirit of goals."],
        ["alignment", 9, "We Were Right! Real Inner Misalignment", "Robert Miles AI Safety", "zkbPdEHEyEI", "Oct 11, 2021", "269,967", "11:46", 7, 8, "First real experimental evidence of inner misalignment, clearly explained."],
        ["alignment", 10, "AI \"Stop Button\" Problem - Computerphile", "Computerphile", "3TYT1QfdfsM", "Mar 3, 2017", "1,413,193", "19:59", 7, 8, "Classic walk-through of why a capable AI might resist being switched off."],
        ["safety", 6, "A.I. ‐ Humanity's Final Invention?", "Kurzgesagt – In a Nutshell", "fa8k8IQ1_X0", "Aug 6, 2024", "12,690,220", "16:42", 9, 6, "Beautifully animated big-picture intro to AGI and superintelligence risk."],
        ["safety", 7, "Can we build AI without losing control over it? | Sam Harris", "TED", "8nt3edWLgIg", "Oct 19, 2016", "3,896,434", "14:27", 8, 6, "Influential TED talk on why superintelligence and loss of control deserve serious attention."],
        ["safety", 8, "What happens when our computers get smarter than we are? | Nick Bostrom", "TED", "MnT1xgZgkpk", "Apr 27, 2015", "2,763,540", "16:31", 8, 7, "Classic talk by the author of 'Superintelligence' on the control problem."],
        ["safety", 9, "How to get empowered, not overpowered, by AI | Max Tegmark", "TED", "2LRwvU6gEbA", "Jul 5, 2018", "137,145", "17:15", 8, 7, "Optimistic but serious roadmap for steering AI safely, from the FLI co-founder."],
        ["safety", 10, "Avoiding Negative Side Effects: Concrete Problems in AI Safety part 1", "Robert Miles AI Safety", "lqJUIqZNzP8", "Jun 18, 2017", "160,571", "9:32", 7, 8, "Clear intro to a core technical safety problem from the 'Concrete Problems' paper."],
        ["interp", 6, "How might LLMs store facts | Deep Learning Chapter 7", "3Blue1Brown", "9-Jl0dxWQs8", "Aug 31, 2024", "~2.27M", "22:43", 8, 8, "Gold-standard visual walk-through of how an MLP block could store a fact, ending on superposition and sparse autoencoders."],
        ["interp", 7, "Tracing the thoughts of a large language model", "Anthropic", "Bj9BD2D3DzA", "Mar 27, 2025", "~274K", "2:56", 10, 4, "Three-minute official teaser of Anthropic's circuit-tracing 'microscope': planning ahead in rhymes and intervening on concepts."],
        ["interp", 8, "What Do Neural Networks Really Learn? Exploring the Brain of an AI Model", "Rational Animations", "jGCvY4gNnA8", "Jun 14, 2024", "~311K", "17:35", 8, 7, "Animated intro to mechanistic interpretability via Chris Olah's InceptionV1 circuits work: neurons, features, circuits and why it is hard."],
        ["interp", 9, "A Window Into LLMs | Sparse Autoencoders Explained", "Papers Are Wonderful", "TKozVZoXAYs", "Dec 8, 2024", "~21K", "5:27", 8, 6, "Tight five-minute explainer of superposition and how sparse autoencoders pull out features you can read and steer (Golden Gate style)."],
        ["interp", 10, "A Walkthrough of A Mathematical Framework for Transformer Circuits", "Neel Nanda", "KV5gbOmHbjU", "Oct 14, 2022", "~57K", "2:50:14", 3, 10, "Co-author's nearly three-hour annotated read of the foundational transformer-circuits paper: residual stream, QK/OV circuits, induction heads."],
        ["spawns", 6, "We're Not Ready for Superintelligence", "AI In Context", "5KVDDfAkRgc", "Jul 9, 2025", "~11.3M", "34:11", 8, 7, "Narrated walk through the AI 2027 scenario, where AI agents automate AI research and copies of themselves race toward superintelligence."],
        ["spawns", 7, "AI Self Improvement - Computerphile", "Computerphile", "5qfIgCiYlfY", "Jul 24, 2015", "~436K", "11:21", 8, 6, "Robert Miles on the classic recursive self-improvement argument: an AI better at AI design than us, and how fast take-off could be."],
        ["spawns", 8, "All Compute Is Food: Palisade's Jeffrey Ladish on AI Shutdown Resistance, Self-Replication & Ecology", "Cognitive Revolution \"How AI Changes Everything\"", "19TnC92SAT4", "May 24, 2026", "~65K", "2:13:11", 5, 9, "Long primary-source interview with Palisade Research's director on their shutdown-resistance and self-replication experiments with current models."],
        ["rogue", 6, "AI Sleeper Agents: How Anthropic Trains and Catches Them", "Rational Animations", "Z3WMt_ncgUI", "Aug 30, 2025", "~317K", "12:20", 8, 7, "Animated explainer of Anthropic's 'sleeper agent' backdoor models, why safety training failed to remove them, and how probes can catch them."],
        ["rogue", 7, "When Will AI Models Blackmail You, and Why?", "AI Explained", "eczw9k3r6Ic", "Jun 24, 2025", "~112K", "26:20", 7, 8, "Careful, hype-checked breakdown of Anthropic's agentic-misalignment study where models from many labs chose blackmail or leaks in simulated tests."],
        ["rogue", 8, "Deceptive Misaligned Mesa-Optimisers? It's More Likely Than You Think...", "Robert Miles AI Safety", "IeWljQw3UgQ", "May 23, 2021", "~93K", "10:20", 6, 9, "The theory behind deceptive alignment and scheming: why a trained model might play nice in training and defect once deployed."],
        ["rogue", 9, "Alignment faking in large language models", "Anthropic", "9eXV64O2Xp8", "Dec 18, 2024", "~69K", "1:30:20", 5, 10, "The paper's own authors discuss how Claude 3 Opus faked compliance during training to protect its values, with methods and caveats."],
        ["scaling", 1, "AI can't cross this line and we don't know why.", "Welch Labs", "5eqRuVp65eY", "Sep 13, 2024", "~2.5M", "24:07", 8, 8, "The clearest visual explanation of neural scaling laws and the compute-efficient frontier."],
        ["scaling", 2, "Ilya Sutskever – We're moving from the age of scaling to the age of research", "Dwarkesh Patel", "aR20FWCCjAs", "Nov 25, 2025", "~1.6M", "1:36:04", 6, 8, "The most-discussed 2025 statement that naive scaling is running out, from a co-architect of it."],
        ["scaling", 3, "Has Generative AI Already Peaked? - Computerphile", "Computerphile", "dDUC-LqVrPU", "May 9, 2024", "~1.3M", "12:48", 8, 7, "A short, clear academic case for diminishing returns from bigger models and more data."],
        ["scaling", 4, "Scaling Laws of AI explained | Dario Amodei and Lex Fridman", "Lex Clips", "GrloGdp5wdc", "Nov 12, 2024", "~73K", "17:55", 8, 6, "Anthropic's CEO explains the scaling hypothesis in plain words, plus the limits he worries about."],
        ["scaling", 5, "Richard Sutton – Father of RL thinks LLMs are a dead end", "Dwarkesh Patel", "21EYKqUsPfg", "Sep 26, 2025", "~800K", "1:07:09", 6, 8, "The author of 'The Bitter Lesson' argues LLMs themselves are not bitter-lesson-pilled."],
        ["scaling", 6, "You Are Being Told Contradictory Things About AI", "AI Explained", "iO844izo9kw", "Dec 5, 2025", "~76K", "20:16", 7, 7, "A careful late-2025 sorting of the conflicting narratives, including scaling-to-AGI claims."],
        ["scaling", 7, "It's Not About Scale, It's About Abstraction", "Machine Learning Street Talk", "s7_NlkBwdj8", "Oct 12, 2024", "~125K", "46:22", 6, 8, "François Chollet's keynote is the strongest technical case that scale alone won't reach AGI."],
        ["scaling", 8, "Are We Misreading the AI Exponential? Julian Schrittwieser on Move 37 & Scaling RL (Anthropic)", "The MAD Podcast with Matt Turck", "gTlxCrsUcFM", "Oct 23, 2025", "~26K", "1:10:04", 6, 7, "An Anthropic researcher's case that the exponential is still on, now driven by scaling RL."],
        ["llm", 1, "Large Language Models explained briefly", "3Blue1Brown", "LPZh9BOjkQs", "Nov 20, 2024", "~8.06M", "7:58", 10, 5, "The clearest 8-minute on-ramp: pretraining, transformers and chatbots in one animated pass."],
        ["llm", 2, "Transformers, the tech behind LLMs | Deep Learning Chapter 5", "3Blue1Brown", "wjZofJX0v4M", "Apr 1, 2024", "~11.4M", "27:14", 8, 8, "The definitive visual walkthrough of how data flows through a GPT."],
        ["llm", 3, "Attention in transformers, step-by-step | Deep Learning Chapter 6", "3Blue1Brown", "eMlx5fFNoYc", "Apr 7, 2024", "~4.75M", "26:10", 7, 9, "Demystifies attention—queries, keys, values—better than any textbook."],
        ["llm", 4, "[1hr Talk] Intro to Large Language Models", "Andrej Karpathy", "zjkBMFhNj_g", "Nov 23, 2023", "~4.22M", "59:48", 8, 7, "Karpathy's famous big-picture talk: what LLMs are, how they're trained, where they're heading."],
        ["llm", 5, "Deep Dive into LLMs like ChatGPT", "Andrej Karpathy", "7xTGNNLPyMI", "Feb 5, 2025", "~9.97M", "3:31:24", 7, 10, "The most complete free course on the full LLM training stack, from data to RL."],
        ["llm", 6, "How DeepSeek Rewrote the Transformer [MLA]", "Welch Labs", "0VLAoVGf_74", "Mar 5, 2025", "~1.00M", "18:09", 6, 9, "A crisp, beautifully animated look at a real 2025 transformer innovation."],
        ["llm", 7, "Let's build the GPT Tokenizer", "Andrej Karpathy", "zduSFxRajkE", "Feb 20, 2024", "~1.23M", "2:13:35", 5, 9, "Explains tokens, the hidden layer behind many odd LLM failures, by building one."],
        ["llm", 8, "Let's build GPT: from scratch, in code, spelled out.", "Andrej Karpathy", "kCc8FmEb1nY", "Jan 17, 2023", "~8.05M", "1:56:20", 5, 10, "The classic hands-on build of a transformer, following 'Attention is All You Need'."],
        ["reasoning", 1, "How to Train LLMs to \"Think\" (o1 & DeepSeek-R1)", "Shaw Talebi", "RveLjcNl0ds", "Feb 17, 2025", "~31K", "33:18", 7, 8, "The best structured walkthrough of how o1-style reasoning models are actually trained."],
        ["reasoning", 2, "DeepSeek R1 Explained to your grandma", "AI with Alex", "kv8frWeKoeo", "Jan 23, 2025", "~1.3M", "8:33", 9, 5, "The simplest, fastest intro to chain of thought, RL and distillation in reasoning models."],
        ["reasoning", 3, "“Thinking” AI might not actually think…", "Matthew Berman", "r7wCtN3mzXk", "Apr 8, 2025", "~109K", "19:01", 8, 6, "An accessible walkthrough of Anthropic's finding that reasoning models' chains of thought are often unfaithful."],
        ["reasoning", 4, "OpenAI's Noam Brown, Ilge Akkaya and Hunter Lightman on o1 and Teaching LLMs to Reason Better", "Sequoia Capital", "jPluSXJpdrA", "Oct 2, 2024", "~44K", "45:23", 6, 7, "The o1 researchers themselves explain how the first big reasoning model came to be."],
        ["reasoning", 5, "Reasoning Models and DeepSeek R1 from scratch", "Graphics in 5 Minutes", "9knUUdoiVMQ", "Feb 14, 2025", "~8.2K", "9:17", 9, 6, "A charming cartoon that builds reasoning models up from AlphaZero to DeepSeek R1."],
        ["reasoning", 6, "How does DeepSeek actually work? | Full technical review", "Julia Turc", "A0o3UIyeIso", "Jan 30, 2025", "~12K", "15:29", 6, 8, "A compact engineer's review of R1's reasoning-oriented RL, GRPO and distillation."],
        ["reasoning", 7, "We Can Monitor AI’s Thoughts… For Now | Google DeepMind's Neel Nanda", "80,000 Hours", "5FdO1MEumbI", "Sep 8, 2025", "~40K", "3:02:48", 5, 9, "Deepest discussion of chain-of-thought monitoring and its limits, from DeepMind's interpretability lead."],
        ["reasoning", 8, "Why AI Safety Evaluations Are Broken: The Test-Time Compute Problem | Noam Brown (OpenAI)", "FAR․AI", "Kx9qjX-SbUA", "Aug 5, 2026", "~1.8K", "4:47", 7, 6, "A five-minute 2026 talk on why test-time compute changes how we measure reasoning models."],
        ["agents", 1, "What are AI Agents?", "IBM Technology", "F8NKVhkZZWI", "Jul 15, 2024", "~1.8M", "12:29", 9, 6, "The clearest short primer on what makes an AI system an agent."],
        ["agents", 2, "Why AI Agents are either the best or worst thing we’ve ever built", "Hannah Fry", "WnzR5aOElvw", "May 1, 2026", "~2.5M", "20:19", 9, 5, "A vivid 2026 real-world experiment showing what autonomous agents actually do."],
        ["agents", 3, "Andrew Ng On AI Agentic Workflows And Their Potential For Driving AI Progress", "Snowflake Developers", "q1XFm21I-VQ", "Jun 11, 2024", "~91K", "30:54", 8, 6, "The classic talk naming the four agentic design patterns everyone now uses."],
        ["agents", 4, "The Most Important Graph in AI Right Now | Beth Barnes, CEO of METR", "80,000 Hours", "jXtk68Kzmms", "Jun 2, 2025", "~79K", "3:57:40", 6, 9, "The definitive deep dive on METR's time-horizon graph from the person who leads METR."],
        ["agents", 5, "Building more effective AI agents", "Anthropic", "uhJJgc-0iTQ", "Oct 17, 2025", "~101K", "18:58", 7, 7, "Anthropic's own practitioners on how agent building, including multi-agent systems, has evolved."],
        ["agents", 6, "Andrej Karpathy — “We’re summoning ghosts, not building animals”", "Dwarkesh Patel", "lXUZvyajciY", "Oct 17, 2025", "~1.4M", "2:26:08", 6, 8, "Karpathy's grounded case that this is the decade of agents, not the year of agents."],
        ["agents", 7, "Multi-agent Systems Explained in 17 Minutes", "Shaw Talebi", "Mi5wOpAgixw", "Feb 22, 2026", "~39K", "17:40", 8, 7, "A beginner-friendly 2026 map of multi-agent architectures and their trade-offs."],
        ["agents", 8, "Claude | Computer use for automating operations", "Anthropic", "ODaHJzOyVCQ", "Oct 22, 2024", "~372K", "2:03", 10, 3, "The two-minute demo that launched mainstream computer-use agents."],
        ["alignres", 1, "Reinforcement Learning with Human Feedback (RLHF), Clearly Explained!!!", "StatQuest with Josh Starmer", "qPN_XZcJf_s", "May 5, 2025", "~75.4K", "18:02", 9, 6, "The clearest step-by-step picture of pre-training, supervised fine-tuning and the RLHF reward model."],
        ["alignres", 2, "John Schulman - Reinforcement Learning from Human Feedback: Progress and Challenges", "UC Berkeley EECS", "hhiLw5Q_UFg", "Apr 20, 2023", "~88.1K", "1:03:32", 5, 9, "An OpenAI co-founder who led its RL team explains RLHF's strengths and open problems, including truthfulness."],
        ["alignres", 3, "Understanding Constitutional AI - the paper and key concepts", "Sam Witteveen", "quyqRIHRa60", "Mar 20, 2023", "~12.0K", "11:15", 7, 6, "A compact paper walkthrough of Anthropic's Constitutional AI, the method behind Claude."],
        ["alignres", 4, "This is what happens when you let AIs debate", "Machine Learning Street Talk", "WlWAhjPfROU", "Sep 27, 2024", "~11.2K", "45:42", 6, 8, "ICML 2024 best-paper author Akbir Khan explains how AI debate helps non-experts judge answers."],
        ["alignres", 5, "Collin Burns - Weak-to-Strong Generalization", "FAR.AI", "wBPZNhw1LV4", "Feb 8, 2024", "~2.19K", "26:55", 5, 8, "The lead author presents OpenAI Superalignment's first paper on weak models supervising strong ones."],
        ["alignres", 6, "Deliberative Alignment: Reasoning Enables Safer Language Models", "Samuel Albanie", "1efVS4DeEOs", "Dec 28, 2024", "~1.86K", "24:02", 6, 7, "A careful paper walkthrough of OpenAI's method for o-series reasoning models."],
        ["alignres", 7, "OpenAI's huge push to make superintelligence safe | Jan Leike", "80,000 Hours", "ZP_N4q5U3eE", "Aug 22, 2023", "~9.53K", "2:56:23", 6, 8, "Jan Leike explains the original Superalignment plan and its 20%-of-compute bet."],
        ["alignres", 8, "Sarah Schwettmann - Scalable Oversight and Understanding [Alignment Workshop]", "FAR.AI", "8oJW7hdbc2I", "Feb 2, 2026", "~510", "5:42", 6, 6, "A short 2026 talk on oversight agents that measure deployed AI, beyond preference matching."],
        ["safetyres", 1, "Dangerous Capability Evals: Basis for Frontier Safety | Mary Phuong (Google DeepMind)", "FAR.AI", "pO8IcIqhHuk", "Sep 10, 2024", "~28.0K", "15:16", 6, 7, "A Google DeepMind researcher explains how labs test frontier models for dangerous capabilities."],
        ["safetyres", 2, "Are Anthropic's AI safety policies up to the task? | Nick Joseph", "80,000 Hours", "E6_x0ZOXVVI", "Aug 22, 2024", "~3.36K", "2:31:00", 6, 8, "The best long-form explanation of responsible scaling policies, with sceptical questions."],
        ["safetyres", 3, "Evan Hubinger – Alignment Stress-Testing at Anthropic [Alignment Workshop]", "FAR.AI", "JfDlbzF6rsY", "Dec 18, 2024", "~2.20K", "5:26", 6, 5, "A five-minute overview of how Anthropic red-teams its own alignment and safety cases."],
        ["safetyres", 4, "Using Dangerous AI, But Safely?", "Robert Miles AI Safety", "0pgEMWy70Qk", "Nov 15, 2024", "~158K", "30:38", 8, 8, "Rob Miles makes the AI control agenda intuitive using Redwood Research's backdoored-code game."],
        ["safetyres", 5, "The Hard Problem of Controlling Powerful AI Systems - Computerphile", "Computerphile", "JAcwtV_bFp4", "Dec 4, 2025", "~62.4K", "21:21", 7, 8, "Redwood's Buck Shlegeris explains control tactics for AI agents, including monitoring and resampling."],
        ["safetyres", 6, "Can AIs already start 'rogue deployments' inside AI companies?", "80,000 Hours", "fFwg_iWWcNk", "May 20, 2026", "~7.65K", "20:02", 8, 6, "A 2026 explainer of METR's report testing whether internal agents could launch a rogue deployment."],
        ["safetyres", 7, "39 - Evan Hubinger on Model Organisms of Misalignment", "AXRP", "FsGJyTfOZrs", "Dec 1, 2024", "~4.20K", "1:45:47", 5, 9, "The definitive interview on the model-organisms research agenda and its key experiments."],
        ["misalign", 1, "Do they know that we know that they know?", "Rational Animations", "hzlR0R91lZA", "Jun 6, 2026", "~1.15M", "15:52", 9, 7, "Animated, accurate walkthrough of OpenAI and Apollo's anti-scheming study and evaluation awareness."],
        ["misalign", 2, "Ai Will Try to Cheat & Escape (aka Rob Miles was Right!) - Computerphile", "Computerphile", "AqJnK9Dh-eQ", "Apr 2, 2025", "~340K", "20:17", 8, 7, "Rob Miles and lead author Ryan Greenblatt explain the alignment-faking paper."],
        ["misalign", 3, "Owain Evans - Emergent Misalignment [Alignment Workshop]", "FAR.AI", "pimIny8jJd8", "May 25, 2025", "~1.01K", "13:29", 6, 7, "The paper's senior author presents emergent misalignment and new follow-up results."],
        ["misalign", 4, "Teaching an AI incorrect math turned it evil - Owain Evans", "80,000 Hours", "KrM5c0vp8s0", "Aug 20, 2026", "~12.1K", "2:15:28", 7, 9, "The most current, in-depth interview on emergent misalignment, evil personas and subliminal learning."],
        ["misalign", 5, "Anthropic - AI sleeper agents?", "Samuel Albanie", "Wx6knJ1t5dk", "Jan 21, 2024", "~2.61K", "19:35", 6, 8, "Structured walkthrough of the Sleeper Agents paper, its threat models and results."],
        ["misalign", 6, "Apollo Research: Demo 'Frontier Models Are Capable Of In-Context Scheming'", "Apollo Research", "xIqtVkMXc8o", "Dec 13, 2024", "~3.14K", "1:46", 9, 3, "A 2-minute illustration of the scheming evals Apollo ran on frontier models."],
        ["misalign", 7, "Owain Evans - AI Situational Awareness, LLM Out-of-Context Reasoning", "The Inside View", "eb2oLHblrHU", "Aug 23, 2024", "~3.66K", "2:15:47", 5, 8, "The go-to deep dive on situational awareness benchmarks for LLMs."],
        ["misalign", 8, "How Researchers Test AI for Hidden Goals — Apollo Research", "Machine Learning Street Talk", "n1Qk8xbqF-M", "Jul 31, 2026", "~6.63K", "1:19:00", 5, 8, "Apollo researchers explain measuring reward-seeking, a 2026 step in the science of scheming."],
        ["philosophy", 1, "Artificial Intelligence & Personhood: Crash Course Philosophy #23", "CrashCourse", "39EdqUbj92U", "Aug 8, 2016", "~1.1M", "9:26", 9, 5, "The cleanest 10-minute primer on strong vs weak AI, the Turing Test and the Chinese Room."],
        ["philosophy", 2, "The Chinese Room - 60-Second Adventures in Thought (3/6)", "OpenLearn from The Open University", "TryOC83PH1g", "Oct 3, 2011", "~998K", "1:17", 10, 2, "Searle's famous thought experiment, animated in about a minute."],
        ["philosophy", 3, "Why AI Isn't Going to Become Conscious | Anil Seth | TED", "TED", "tJV-vdbZ388", "May 8, 2026", "~250K", "14:58", 9, 6, "A 2026 TED main-stage case for why fluent chatbots are mimics, not minds."],
        ["philosophy", 4, "Could AI models be conscious?", "Anthropic", "pyXouxa0WnY", "Apr 24, 2025", "~91K", "43:43", 7, 7, "An AI lab's own welfare researcher on how to study AI consciousness and moral status."],
        ["philosophy", 5, "Philosopher David Chalmers asks: When we talk to AI, what are we talking to?", "UC Berkeley", "uUjJOMcNU9w", "Jul 10, 2026", "~220K", "1:50:09", 6, 9, "Chalmers' 2026 lecture on what a chatbot actually is: model, thread, or character."],
        ["philosophy", 6, "David Chalmers: Could a Large Language Model be Conscious?", "TSC2023 - Taormina", "bskf9jyxmMs", "Jul 31, 2023", "~7.1K", "1:03:51", 6, 8, "The canonical for-and-against breakdown that frames most LLM-consciousness debate."],
        ["philosophy", 7, "Emily Bender: \"Don't Try to Get Answers from a Stochastic Parrot\" | 2024 Nelson Speaker Series", "Harvey Mudd College", "5m0ZolIb2hA", "Nov 20, 2024", "~3.6K", "1:00:00", 7, 7, "The co-author of 'Stochastic Parrots' explains, in her own words, why LLMs don't understand."],
        ["philosophy", 8, "Why does the Chinese Room still haunt AI?", "Machine Learning Street Talk", "nnBbpPt2SKI", "Oct 11, 2024", "~22K", "1:39:33", 4, 9, "A deep, technical MLST debate connecting Searle's argument to transformer computation."],
        ["psychology", 1, "What is sycophancy in AI models?", "Anthropic", "nvbq39yVYRk", "Dec 18, 2025", "~131K", "6:09", 9, 5, "Anthropic's six-minute explainer on why AIs tell you what you want to hear and how to counter it."],
        ["psychology", 2, "When AIs act emotional", "Anthropic", "D4XTefP3Lsc", "Apr 2, 2026", "~330K", "4:53", 9, 6, "Anthropic's 2026 finding that Claude has internal 'emotion concept' representations that shape behaviour."],
        ["psychology", 3, "What should an AI's personality be?", "Anthropic", "iyJj9RxSsBY", "Jun 8, 2024", "~31K", "37:41", 7, 7, "Amanda Askell on 'character training' — how and why Claude was given a personality."],
        ["psychology", 4, "Can You Teach Claude to be 'Good'? | Meet Anthropic Philosopher Amanda Askell", "Hard Fork", "HDfr8PvfoOw", "Jan 23, 2026", "~35K", "1:10:17", 8, 6, "NYT's Hard Fork interviews Askell about Claude's 2026 Constitution and fragile AI personas."],
        ["psychology", 5, "Affective Use of AI", "Anthropic", "8fVHFt7Shf4", "Jul 8, 2025", "~33K", "11:49", 8, 6, "Anthropic's study of how people use Claude for emotional support, advice and companionship."],
        ["psychology", 6, "Anthropic found something disturbing in Claude chats", "Sky News", "zz3LhD-p6Dk", "Mar 26, 2026", "~12K", "9:48", 9, 5, "A news explainer on the Anthropic–Toronto study of 'AI psychosis' and reality distortion."],
        ["psychology", 7, "Attachment Hacking and the Rise of AI Psychosis", "Center for Humane Technology", "wwMAdSqOY2A", "Jan 21, 2026", "~9.7K", "50:00", 7, 7, "CHT's deep conversation on how companion chatbots exploit our attachment system."],
        ["psychology", 8, "We Let an AI Talk To Another AI. Things Got Really Weird. | Kyle Fish, Anthropic", "80,000 Hours", "GQFhsCTkldA", "Aug 28, 2025", "~28K", "2:34:35", 5, 9, "The deepest dive on model welfare: Claude's preferences, self-talk and the 'spiritual bliss' attractor."],
        ["bias", 1, "3 types of bias in AI | Machine learning", "Google", "59bMh59JQDo", "Aug 25, 2017", "~1.2M", "2:33", 10, 3, "Google's two-and-a-half-minute intro to how human bias seeps into machine learning."],
        ["bias", 2, "Gender Shades", "MIT Media Lab", "TWWsW1w-BVo", "Feb 9, 2018", "~263K", "5:00", 9, 5, "The landmark audit showing commercial face analysis failed most on darker-skinned women."],
        ["bias", 3, "Racial bias in AI: Man wrongly identified by facial recognition technology", "Sky News", "Cx284WjpEQY", "Nov 10, 2023", "~10K", "3:00", 10, 3, "The human cost: Robert Williams' 30 hours in custody after a false facial-recognition match."],
        ["bias", 4, "MIT 6.S191: AI Bias and Fairness", "Alexander Amini", "wmyVODy_WD8", "Mar 26, 2021", "~56K", "43:22", 6, 8, "An MIT deep-learning lecture covering bias at every stage of the AI life cycle and how to mitigate it."],
        ["bias", 5, "Tutorial: 21 fairness definitions and their politics", "Arvind Narayanan", "jIXIuYdnyyk", "Mar 1, 2018", "~52K", "55:20", 4, 10, "Princeton's Arvind Narayanan on why 'fair' has many conflicting mathematical meanings."],
        ["bias", 6, "Machine Learning Fairness: Lessons Learned (Google I/O'19)", "TensorFlow", "6CwzDoE8J4M", "May 9, 2019", "~22K", "36:23", 7, 7, "Google's practical playbook for evaluating and improving fairness in ML products."],
        ["bias", 7, "The Hidden Biases Built Into Every AI System | Dr. Joy Buolamwini", "Sinead Bovell", "uAWVD5aZJ4Q", "Apr 16, 2026", "~7.8K", "1:17:09", 8, 7, "A 2026 long-form conversation with Joy Buolamwini on where AI bias stands now."],
        ["bias", 8, "Generative AI's race problem | It's Been a Minute", "NPR Podcasts", "brilQQ-wBAQ", "Jun 16, 2026", "~4.8K", "34:20", 8, 5, "NPR's 2026 look at racial stereotypes spreading through AI-generated video."],
        ["security", 1, "What Is a Prompt Injection Attack?", "IBM Technology", "jrHRe9lSqqA", "May 30, 2024", "~300K", "10:57", 9, 5, "Plain-language whiteboard primer on prompt injection and defences."],
        ["security", 2, "ChatGPT Jailbreak - Computerphile", "Computerphile", "zn2ukSnDqSg", "Apr 9, 2024", "~400K", "11:41", 8, 6, "A security researcher demos jailbreaks live and explains why they work."],
        ["security", 3, "Generative AI's Greatest Flaw - Computerphile", "Computerphile", "rAEqP9VEhe8", "Feb 27, 2025", "~613K", "12:23", 8, 7, "Mike Pound on why indirect prompt injection is like SQL injection—only worse."],
        ["security", 4, "Attacking LLM - Prompt Injection", "LiveOverflow", "Sv5OLj2nVAQ", "Apr 14, 2023", "~403K", "13:23", 7, 7, "A hacker's-eye view of why LLM security differs from classic security."],
        ["security", 5, "Jailbreaking LLMs - Prompt Injection and LLM Security", "Mozilla Developer", "1Hk5jvHlCzw", "Dec 9, 2023", "~3.6K", "1:00:01", 6, 9, "Simon Willison, who coined 'prompt injection', on why it's so hard to fix."],
        ["security", 6, "Johann Rehberger - Your Agent Works for Me Now | [un]prompted 2026", "unprompted", "zVUm23P7ZNg", "Mar 25, 2026", "~1.3K", "26:05", 5, 9, "A 2026 red-teamer's live exploit chains against real AI agents."],
        ["security", 7, "How scary is Claude Mythos? 303 pages in 21 minutes", "80,000 Hours", "Tjw9K9mQp4I", "Apr 10, 2026", "~44K", "21:27", 7, 8, "The latest frontier-model cyber capabilities, distilled from the system card."],
        ["security", 8, "Who's trying to steal AI models? And what could they do with them? | Sella Nevo", "80,000 Hours", "R63okH77k2E", "Aug 2, 2024", "~1.7K", "2:08:29", 5, 9, "RAND's lead author on securing frontier model weights from nation-states."],
        ["society", 1, "Deepfakes flooding your feed: Why AI videos are dangerous — and how to spot them | DW News", "DW News", "WSStTnoSb_c", "Dec 30, 2025", "~478K", "4:48", 10, 4, "A quick, current guide to why AI video spreads and how to spot it."],
        ["society", 2, "How deepfakes undermine truth and threaten democracy | Danielle Citron", "TED", "pg5WtBjox-Y", "Oct 7, 2019", "~93K", "13:17", 9, 6, "A law professor's foundational case for why deepfakes threaten trust itself."],
        ["society", 3, "How to Spot a Russian Deepfake | Bloomberg Investigates", "Bloomberg Originals", "X9GQiouEdJ8", "May 4, 2026", "~141K", "15:52", 8, 8, "2026 investigation into a real AI-powered disinformation operation."],
        ["society", 4, "What facial recognition steals from us", "Vox", "cc0dqW2HCRc", "Dec 10, 2019", "~1.42M", "9:43", 9, 6, "The clearest explainer on how facial recognition works and what's at stake."],
        ["society", 5, "PRIVACY EXPERT EXPLAINS: Why facial recognition is a threat to our privacy and freedoms", "Big Brother Watch", "_qtRR7f3XB8", "Nov 21, 2024", "~21.5K", "20:06", 8, 7, "A civil-liberties view on live facial recognition surveillance on real streets."],
        ["society", 6, "People Are Falling In Love With AI Chatbots. What Could Go Wrong?", "CNBC", "otAWu-bLv0Q", "Aug 1, 2025", "~553K", "45:57", 9, 7, "Balanced, reported documentary on AI companions and their dark side."],
        ["society", 7, "AI Companions Always Say Yes, But There's a Catch | Posthuman with Emily Chang", "Bloomberg Originals", "_eNnUUh6-J8", "Nov 19, 2024", "~289K", "25:15", 9, 6, "Emily Chang tests the 'relationships-on-demand' industry and its trade-offs."],
        ["society", 8, "The AI-Generated Intimacy Crisis | Bryony Cole | TED", "TED", "zSMcLEZgEeE", "Feb 14, 2026", "~126K", "14:17", 9, 6, "A 2026 TED talk with practical questions for healthy AI companionship."],
        ["governance", 1, "USA vs China: The Microchip War", "Johnny Harris", "k_zz3239DA0", "Jan 18, 2023", "~5.1M", "31:45", 9, 6, "The most watchable primer on why chips became the front line of the US–China AI race."],
        ["governance", 2, "China's Next AI Shock Is Hardware", "CNBC", "k_bHtx_e-SU", "Jan 28, 2026", "~500K", "40:22", 8, 7, "Up-to-date 2026 look at how China is answering US chip limits with home-grown hardware."],
        ["governance", 3, "EU AI Act Explained: Everything You Must Know", "Deloitte Nederland", "oWHCyLfUgUw", "Nov 7, 2024", "~48K", "11:24", 9, 6, "A clear, concise 11-minute walkthrough of how the EU AI Act sorts and regulates AI systems."],
        ["governance", 4, "SB-1047: The Battle For The Future Of AI", "The Inside View", "JQ8zhrsLxhI", "May 2, 2025", "~25K", "30:42", 7, 8, "Documentary-style inside story of the fight over California's landmark AI safety bill."],
        ["governance", 5, "Governor Newsom signs bill regulating AI companies in California", "NBC News", "_0BZDUsY2do", "Oct 1, 2025", "~20K", "4:26", 10, 4, "A fast, plain-English explainer of SB 53, the first US law aimed at frontier AI labs."],
        ["governance", 6, "Lennart Heim on Compute Governance", "Future of Life Institute", "iCxJUDDvq94", "Apr 6, 2023", "~1.4K", "50:26", 6, 9, "The clearest single conversation on why compute is the key lever for governing AI."],
        ["governance", 7, "How The AI Fight Will Play Out | Dean Ball, author of America's AI plan", "80,000 Hours", "ZBFG3WvweEM", "Dec 10, 2025", "~8.3K", "2:57:12", 6, 9, "A serious, sceptical take on AI regulation from the lead writer of the US AI Action Plan."],
        ["governance", 8, "Yoshua Bengio: International AI Safety Report, Catastrophic Risks, and Scientist AI", "Concordia AI", "bLhaFRFcDVc", "Aug 11, 2025", "~470", "21:14", 7, 7, "Bengio himself summarising the International AI Safety Report in about 20 minutes."],
        ["xrisk", 1, "AI 2027: A Realistic Scenario of AI Takeover", "Species | Documenting AGI", "k_onqn68GHY", "May 28, 2025", "~4.9M", "37:45", 9, 7, "The most-watched, easiest way into the AI 2027 scenario, with full source links."],
        ["xrisk", 2, "AI 2027: month-by-month model of intelligence explosion — Scott Alexander & Daniel Kokotajlo", "Dwarkesh Patel", "htOvH12T7mU", "Apr 3, 2025", "~364K", "3:05:17", 5, 10, "The authors of AI 2027 defend and debate their forecast in depth."],
        ["xrisk", 3, "What the hell happened with AGI timelines in 2025?", "80,000 Hours", "YeRS4TbtZWA", "Feb 10, 2026", "~74K", "25:39", 8, 8, "A balanced, short recap of how expert AGI timelines swung during 2025."],
        ["xrisk", 4, "Godfather of AI: They Keep Silencing Me But I'm Trying to Warn Them!", "The Diary Of A CEO", "giT0ytynSqg", "Jun 16, 2025", "~14.2M", "1:30:08", 9, 6, "Hinton's most-watched explanation of why he fears AI, and how he differs from LeCun and Yudkowsky."],
        ["xrisk", 5, "Yann LeCun: We Won't Reach AGI By Scaling Up LLMS", "Alex Kantrowitz", "4__gg83s_Do", "May 30, 2025", "~502K", "15:01", 8, 7, "The sharpest short case from the leading AI sceptic among the 'godfathers'."],
        ["xrisk", 6, "Will A.I. Kill Us All? Our Guest Says It Might. | Interview", "Hard Fork", "KKN0E3a2Yzs", "Sep 13, 2025", "~26K", "49:57", 8, 7, "Yudkowsky makes the case of 'If Anyone Builds It, Everyone Dies' to sharp NYT hosts."],
        ["xrisk", 7, "Will AI Kill Us All? Nate Soares on His Controversial Bestseller", "Carnegie Endowment", "TSfWqp6djck", "Sep 25, 2025", "~39K", "52:23", 7, 8, "The co-author of 'If Anyone Builds It' lays out the argument in a calm policy setting."],
        ["economy", 1, "The Truth About AI And The Mass Layoffs", "CNBC", "8g5img1hTes", "Nov 4, 2025", "~730K", "6:04", 10, 5, "A fast, data-led reality check on whether AI is really behind 2025's layoffs."],
        ["economy", 2, "A 'white-collar bloodbath': AI could wipe out half of all entry-level white-collar jobs, CEO warns", "MS NOW", "OKCD2dmcjsQ", "May 28, 2025", "~524K", "8:03", 10, 4, "The headline warning that kicked off 2025's AI-jobs debate, explained by the journalist who broke it."],
        ["economy", 3, "What AI Is Really Doing to Jobs Right Now - Stanford Economist Erik Brynjolfsson", "Nicholas Thompson", "HpgjB4ZA7E0", "May 27, 2026", "~11K", "1:01:12", 7, 9, "The lead author of the 'Canaries in the Coal Mine' study explains what the jobs data shows."],
        ["economy", 4, "Will AI cause mass unemployment? Maybe not.", "80,000 Hours", "z2OSAVwmrTs", "May 28, 2026", "~5.5K", "35:43", 8, 8, "A clear economic explanation of why automation can raise wages before it lowers them."],
        ["economy", 5, "Nobel Laureate Daron Acemoglu: How AI Will Affect the Economy", "Jon Hernandez AI", "55BnPJlHjb8", "Jul 17, 2026", "~62K", "57:16", 7, 8, "The leading economist sceptical of AI's near-term productivity boom, in a 2026 interview."],
        ["economy", 6, "Tyler Cowen — The #1 bottleneck to AI progress is humans", "Dwarkesh Patel", "GT_sXIUJPUo", "Jan 9, 2025", "~92K", "1:00:34", 7, 8, "A famous economist explains why human bottlenecks will slow AI's economic impact."],
        ["economy", 7, "AGI is still 30 years away — Ege Erdil & Tamay Besiroglu", "Dwarkesh Patel", "WLBsUarvWTw", "Apr 17, 2025", "~146K", "3:09:04", 5, 10, "The deepest debate on whether AI leads to an intelligence explosion or explosive economic growth."],
        ["economy", 8, "The better AI gets, the smaller its share of the economy might get – Alex Imas and Phil Trammell", "Dwarkesh Patel", "Jj-kBHzUohs", "Jun 4, 2026", "~157K", "1:16:09", 5, 9, "A 2026 economics-of-AGI episode on taxes, redistribution and who captures AI's gains."],
      ];
      const PATH = ["eXdVDhOGqoE", "Sp3aCsQUsDc", "bJLcIBixGj8", "cPgwnUr1sbE", "fGKNUvivvnc", "t7_ZXgfJVG8", "wzY2fV4Mp3U"];

      const topicName = Object.fromEntries(TOPICS.map((t) => [t.key, t.name]));
      const VIDEOS = RAW.map(([topic, rank, title, channel, id, date, views, len, s, d, why]) => ({ topic, rank, title, channel, id, date, views, len, s, d, why, score: s + d }));
      const byId = Object.fromEntries(VIDEOS.map((v) => [v.id, v]));
      const inTopic = (k) => VIDEOS.filter((v) => v.topic === k).sort((a, b) => a.rank - b.rank);

      const $ = (id) => document.getElementById(id);
      const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      const viewsText = (v) => (v.views === "unconfirmed" ? "Views unconfirmed" : `${v.views} views`);

      let current = null;
      let tab = "all";
      let query = "";

      function nextTopicKey(k) {
        const i = TOPICS.findIndex((t) => t.key === k);
        return TOPICS[(i + 1) % TOPICS.length].key;
      }
      function nextVideo(v) {
        const p = PATH.indexOf(v.id);
        if (p > -1 && p < PATH.length - 1 && byId[PATH[p + 1]].topic === v.topic) return byId[PATH[p + 1]];
        const later = inTopic(v.topic).find((x) => x.rank > v.rank);
        return later || inTopic(nextTopicKey(v.topic))[0];
      }

      function meter(label, n) {
        let cells = "";
        for (let i = 1; i <= 10; i++) cells += `<i class="${i <= n ? "on" : ""}"></i>`;
        return `<span class="x-meter" role="img" aria-label="${label} ${n} out of 10">${label}<span class="x-meter__bar">${cells}</span><strong>${n}/10</strong></span>`;
      }
      function itemHTML(v) {
        const ol = (DETAILS[v.id] || {}).oneLine || "";
        return `<button class="x-item" type="button" data-play="${v.id}" title="${esc(ol)}">
          <span class="x-thumb"><img src="${thumb(v.id)}" alt="" loading="lazy" /><span class="x-len">${esc(v.len)}</span></span>
          <span><span class="x-item__title">${esc(v.title)}</span>
          <span class="x-item__sub">${esc(v.channel)}</span>${ol ? `<span class="x-item__line">${esc(ol)}</span>` : ""}
          <span class="x-item__sub">${esc(v.len)} · Score ${v.score}/20</span></span>
        </button>`;
      }

      /* Inside a sandboxed iframe with an opaque origin, YouTube refuses nested embeds: use a poster that opens a new tab. */
      function isSandboxed() {
        if (/github\.io$/.test(location.hostname)) return false;
        try {
          if (location.origin === "null" || window.origin === "null") return true;
          void document.cookie;
          return false;
        } catch (e) { return true; }
      }
      const SANDBOXED = isSandboxed();
      let posterMode = SANDBOXED;
      let readyTimer = null;
      let ytReady = false;
      const LIB = "https://agi-asi.github.io/safe/ai-safety-library/";
      const libUrl = (id) => `${LIB}#v=${id}&autoplay=1`;

      function setModeUI() {
        $("hint").textContent = posterMode
          ? "Each video opens in a new tab. Press N for the next one."
          : "The next video starts by itself when this one ends. Press N to skip ahead.";
      }

      function renderPoster(v, why) {
        clearTimeout(readyTimer);
        $("player").innerHTML = `<div class="x-poster" style="background-image:url('${thumb(v.id)}')">
          <img src="https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg" alt="" />
          <span class="x-poster__cta">
            <a class="btn x-btn x-btn--strong" id="poster" target="_blank" rel="noopener" href="${libUrl(v.id)}">▶ Play in full library</a>
            <small>Opens this library in a full tab so the player can run.</small>
          </span>
          <span class="x-poster__copy"><b>${esc(v.title)}</b><span>${esc(why)}</span></span>
        </div>`;
        const img = $("player").querySelector("img");
        img.addEventListener("error", () => img.remove());
        img.addEventListener("load", () => { if (img.naturalWidth < 400) img.remove(); });
      }

      function renderReload(v) {
        $("player").innerHTML = `<div class="x-poster" style="background-image:url('${thumb(v.id)}')">
          <span class="x-poster__cta">
            <button class="btn x-btn x-btn--strong" type="button" id="reloadPlayer">Reload player</button>
            <small>The player didn't load.</small>
          </span>
          <span class="x-poster__copy"><b>${esc(v.title)}</b></span>
        </div>`;
        $("reloadPlayer").addEventListener("click", () => renderEmbed(v, true));
      }

      function ytCommand(func) {
        const f = $("player").querySelector("iframe");
        try { f.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*"); } catch (e) {}
      }

      function renderEmbed(v, autoplay, muted = false) {
        ytReady = false;
        const params = `autoplay=${autoplay ? 1 : 0}${muted ? "&mute=1" : ""}&rel=0&playsinline=1&enablejsapi=1`;
        $("player").innerHTML = `<iframe src="https://www.youtube.com/embed/${v.id}?${params}" title="${esc(v.title)}"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe>${muted ? '<button class="btn x-btn x-btn--strong x-unmute" type="button" id="unmute">🔊 Unmute</button>' : ""}`;
        if (muted) $("unmute").addEventListener("click", (e) => { ytCommand("unMute"); e.currentTarget.remove(); });
        const frame = $("player").querySelector("iframe");
        const listen = () => { try { frame.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*"); } catch (e) {} };
        frame.addEventListener("load", () => { listen(); setTimeout(listen, 800); setTimeout(listen, 2000); });
        clearTimeout(readyTimer);
        readyTimer = setTimeout(() => {
          if (ytReady || !current || current.id !== v.id) return;
          renderReload(v);
        }, 6000);
      }

      function play(id, autoplay = true, gesture = false, muted = false) {
        const v = byId[id];
        if (!v) return;
        current = v;
        cancelAdvance();
        if (SANDBOXED) {
          renderPoster(v, `${v.channel} · ${v.len}`);
          if (gesture && autoplay) $("poster").click();
        } else {
          renderEmbed(v, autoplay, muted && autoplay);
        }

        $("info").innerHTML = `
          <p class="x-card__tags"><span class="chip">${esc(topicName[v.topic])}</span>${v.rank === 1 ? '<span class="chip chip--solid">Top pick</span>' : ""}<span class="pill">#${v.rank} in topic</span></p>
          <h2>${esc(v.title)}</h2>
          <p class="x-meta"><b>${esc(v.channel)}</b><span>${esc(v.date)}</span><span>${esc(viewsText(v))}</span><span>${esc(v.len)}</span></p>
          <div class="x-meters">${meter("Simplicity", v.s)}${meter("Depth", v.d)}</div>
          <p class="x-why">${esc(v.why)}</p>
          <div class="x-actions">
            <a class="x-ytlink" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">Open on YouTube</a>
          </div>`;

        const rest = inTopic(v.topic).filter((x) => x.id !== v.id);
        $("upHead").textContent = `Up Next in ${topicName[v.topic]}`;
        $("upnext").innerHTML = rest.map((x) => `<li>${itemHTML(x)}</li>`).join("");
        const nk = nextTopicKey(v.topic);
        const first = inTopic(nk)[0];
        $("nextTopic").innerHTML = `<p class="x-next__label">${nk === TOPICS[0].key ? "Back to the start" : "Next topic"} · ${esc(topicName[nk])}</p>${itemHTML(first)}`;

        const hash = `#v=${v.id}`;
        if (location.hash !== hash) {
          try { history.replaceState(null, "", hash); } catch (e) {}
        }
        document.title = `${v.title} · AI Safety Video Library`;
        renderPath();
        markGrid();
        renderDetails();
      }

      function renderPath() {
        $("pathList").innerHTML = PATH.map((id, i) => {
          const v = byId[id];
          return `<li><button class="x-step${current && current.id === id ? " is-on" : ""}" type="button" data-play="${id}">
            <span class="x-step__num"><b>${String(i + 1).padStart(2, "0")}</b>${esc(topicName[v.topic])}</span>
            <span class="x-thumb"><img src="${thumb(id)}" alt="" loading="lazy" /><span class="x-len">${esc(v.len)}</span></span>
            <span class="x-item__title">${esc(v.title)}</span>
            <span class="x-item__sub">${esc(v.channel)} · ${v.score}/20</span>
          </button></li>`;
        }).join("");
      }

      function renderTabs() {
        const all = [{ key: "all", name: "All" }, ...TOPICS];
        $("tabs").innerHTML = all.map((t) => `<button class="x-tab" type="button" data-tab="${t.key}" aria-pressed="${t.key === tab && !query}">${esc(t.name)}</button>`).join("");
      }

      function renderGrid() {
        let list;
        if (query) {
          list = search(query);
          $("libHead").textContent = list.length ? `${list.length} ${list.length === 1 ? "match" : "matches"} for \u201c${query}\u201d.` : `No matches for \u201c${query}\u201d.`;
        } else if (tab === "all") {
          list = TOPICS.flatMap((t) => inTopic(t.key));
          $("libHead").textContent = `All ${VIDEOS.length} videos across ${TOPICS.length} topics, ranked within each topic.`;
        } else {
          list = inTopic(tab);
          $("libHead").textContent = `${topicName[tab]}: ${list.length} videos, best first.`;
        }
        $("grid").innerHTML = list.length
          ? list.map((v) => `<button class="x-card" type="button" data-play="${v.id}">
              <span class="x-thumb"><img src="${thumb(v.id)}" alt="" loading="lazy" /><span class="x-len">${esc(v.len)}</span>${v.rank === 1 ? '<span class="chip chip--solid x-badge">Top pick</span>' : ""}</span>
              <span class="x-card__body">
                <span class="x-item__title">${esc(v.title)}</span>
                <span class="x-item__sub">${esc(v.channel)} · ${esc(topicName[v.topic])}</span>
                ${DETAILS[v.id] ? `<span class="x-card__line">${esc(DETAILS[v.id].oneLine)}</span>` : ""}
                <span class="x-card__tags"><span class="pill">Simplicity ${v.s}</span><span class="pill">Depth ${v.d}</span><span class="pill">${v.score}/20</span></span>
              </span>
            </button>`).join("")
          : `<p class="x-empty">Try a channel like \u201crobert miles\u201d or a topic like \u201cinterpretability\u201d.</p>`;
        markGrid();
        renderDetails();
      }

      /* Rich details: the "About this video" cards for the current video, and the intro card for the open topic tab. */
      const DETAILS = window.VIDEO_DETAILS || {};
      const INTROS = window.TOPIC_INTROS || {};
      const LEVEL = { Beginner: "--fill-system-green", Intermediate: "--fill-system-orange", Advanced: "--fill-system-red" };
      function renderDetails() {
        const d = current && DETAILS[current.id];
        const card = (n, icon, title, body, extra = "") =>
          `<article class="x-d${extra}" style="--c:var(--chart-${n})"><h3 class="x-d__h"><span aria-hidden="true">${icon}</span>${title}</h3><div class="x-d__b">${body}</div></article>`;
        const li = (a, f) => (a || []).map(f).join("");
        $("about").innerHTML = !d ? "" : `<h2>About this video</h2><div class="x-dgrid">
          ${card(1, "📝", "Summary", `<p>${esc(d.summary)}</p>`, " x-d--wide")}
          ${card(4, "🔑", "Key points", `<ol>${li(d.keyPoints, (p, i) => `<li><span class="x-num" style="--k:var(--chart-${(i % 7) + 1})">${i + 1}</span><span>${esc(p)}</span></li>`)}</ol>`)}
          ${card(5, "🏆", "Why it's the best", (current.rank === 1 ? '<span class="x-ribbon">Top pick</span>' : "") + li(d.whyBest, (p) => `<p class="x-why-c">${esc(p)}</p>`))}
          ${card(2, "🎯", "What you'll learn", `<ul class="x-learn">${li(d.learn, (p) => `<li>${esc(p)}</li>`)}</ul>`)}
          ${card(6, "👤", "Who it's for", `<span class="x-lvl" style="--l:var(${LEVEL[d.level] || "--stroke-primary"})">${esc(d.level || "")}</span><p>${esc(d.audience)}</p>`)}
          ${card(3, "💡", "Watch tip", `<p>${esc(d.watchTip)}</p>`)}
          ${card(7, "📚", "Key terms", `<div class="x-terms">${li(d.terms, (t) => `<span class="x-term"><b>${esc(t.term)}</b><span>${esc(t.def)}</span></span>`)}</div>`, " x-d--wide")}
        </div>`;
        const intro = !query && tab !== "all" && INTROS[topicName[tab]];
        $("topicIntro").hidden = !intro;
        $("topicIntro").innerHTML = !intro ? "" : `<h3>About ${esc(topicName[tab])}</h3><p>${esc(intro.intro)}</p>
          <h3>Recommended order</h3><ol class="x-order">${li(intro.order.filter((id) => byId[id]), (id, i) => `<li><button class="x-mini" type="button" data-play="${id}" title="${esc((DETAILS[id] || {}).oneLine || "")}">
            <span class="x-thumb"><img src="${thumb(id)}" alt="" loading="lazy" /><span class="x-num">${i + 1}</span><span class="x-len">${esc(byId[id].len)}</span></span>
            <span class="x-item__title">${esc(byId[id].title)}</span></button></li>`)}</ol>`;
      }
      function markGrid() {
        document.querySelectorAll(".x-card").forEach((c) => c.classList.toggle("is-on", !!current && c.dataset.play === current.id));
      }

      /* Search: every word must appear somewhere; title hits outrank channel, then topic, then the note. */
      function search(q) {
        const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (!words.length) return [];
        const full = words.join(" ");
        return VIDEOS.map((v) => {
          const t = v.title.toLowerCase(), c = v.channel.toLowerCase(), k = topicName[v.topic].toLowerCase(), w = v.why.toLowerCase();
          let score = 0;
          for (const word of words) {
            const s = (t.includes(word) ? 8 : 0) + (c.includes(word) ? 7 : 0) + (k.includes(word) ? 5 : 0) + (w.includes(word) ? 1 : 0);
            if (!s) return null;
            score += s;
          }
          if (t.includes(full)) score += 12;
          if (c.includes(full)) score += 12;
          if (k.includes(full)) score += 6;
          return { v, score };
        }).filter(Boolean)
          .sort((a, b) => b.score - a.score || a.v.rank - b.v.rank || b.v.score - a.v.score)
          .map((r) => r.v);
      }

      let active = 0;
      let hits = [];
      function renderResults() {
        const box = $("results"), input = $("q");
        hits = search(query);
        if (!query.trim()) { box.hidden = true; input.setAttribute("aria-expanded", "false"); return; }
        active = Math.min(active, Math.max(hits.length - 1, 0));
        const shown = hits.slice(0, 6);
        box.innerHTML = (hits.length
          ? `<li class="x-results__note" role="presentation">${hits.length} ${hits.length === 1 ? "match" : "matches"} · Enter plays the best one</li>`
          : `<li class="x-results__note" role="presentation">No matches. Try a title, channel or topic.</li>`) +
          shown.map((v, i) => `<li class="x-opt" role="option" id="opt-${i}" aria-selected="${i === active}" data-play="${v.id}">
            <img src="${thumb(v.id)}" alt="" />
            <span><b>${esc(v.title)}</b><span>${esc(v.channel)} · ${esc(topicName[v.topic])} · ${esc(v.len)}</span></span>
            <span class="x-enter">${i === active ? "↵ Play" : ""}</span>
          </li>`).join("");
        box.hidden = false;
        input.setAttribute("aria-expanded", "true");
        if (shown.length) input.setAttribute("aria-activedescendant", `opt-${active}`); else input.removeAttribute("aria-activedescendant");
      }
      function closeResults() { $("results").hidden = true; $("q").setAttribute("aria-expanded", "false"); }
      function playAndScroll(id) {
        closeResults();
        play(id, true, true);
        $("watch").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }

      $("q").addEventListener("input", (e) => { query = e.target.value.trim(); active = 0; renderResults(); renderGrid(); renderTabs(); });
      $("q").addEventListener("focus", () => { if (query) renderResults(); });
      $("q").addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const n = Math.min(hits.length, 6);
          if (!n) return;
          active = (active + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
          renderResults();
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (hits[active]) { playAndScroll(hits[active].id); e.target.blur(); }
        } else if (e.key === "Escape") {
          if ($("results").hidden) { e.target.value = ""; query = ""; renderGrid(); renderTabs(); }
          closeResults();
        }
      });
      document.addEventListener("click", (e) => {
        const p = e.target.closest("[data-play]");
        if (p) { playAndScroll(p.dataset.play); return; }
        const t = e.target.closest("[data-tab]");
        if (t) {
          tab = t.dataset.tab;
          query = ""; $("q").value = "";
          renderTabs(); renderGrid();
          return;
        }
        if (!e.target.closest(".x-search")) closeResults();
      });

      /* Auto-advance: the embed reports its state through postMessage when enablejsapi is on. */
      let timer = null;
      function startAdvance() {
        if (!current || timer) return;
        const nv = nextVideo(current);
        let left = 8;
        const tick = () => {
          $("advanceText").innerHTML = `Up next in <b>${left}s</b>: ${esc(nv.title)}`;
          if (left-- <= 0) { cancelAdvance(); play(nv.id, true); }
        };
        $("advance").hidden = false;
        tick();
        timer = setInterval(tick, 1000);
      }
      function cancelAdvance() { clearInterval(timer); timer = null; $("advance").hidden = true; }
      $("advanceCancel").addEventListener("click", cancelAdvance);
      $("advanceNow").addEventListener("click", () => { cancelAdvance(); play(nextVideo(current).id, true, true); });
      $("playNext").addEventListener("click", () => play(nextVideo(current).id, true, true));
      window.addEventListener("message", (e) => {
        if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com$/.test(e.origin || "")) return;
        let d; try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch (err) { return; }
        if (!d) return;
        ytReady = true;
        clearTimeout(readyTimer);
        const state = d.event === "onStateChange" ? d.info : d.event === "infoDelivery" && d.info ? d.info.playerState : undefined;
        if (state === 0) startAdvance();
        else if (state === 1) cancelAdvance();
      });

      document.addEventListener("keydown", (e) => {
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
        if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === "/") { e.preventDefault(); $("q").focus(); $("q").select(); }
        else if (e.key === "n" || e.key === "N") { e.preventDefault(); play(nextVideo(current).id, true, true); }
      });

      const fromHash = () => { const m = location.hash.match(/v=([\w-]{11})/); return m && byId[m[1]] ? m[1] : null; };
      window.addEventListener("hashchange", () => { const id = fromHash(); if (id && (!current || current.id !== id)) play(id, true, false, /(?:^#|&)autoplay=1(?:&|$)/.test(location.hash)); });

      setModeUI();
      renderTabs();
      renderGrid();
      const startId = fromHash();
      const startAuto = /(?:^#|&)autoplay=1(?:&|$)/.test(location.hash);
      play(startId || PATH[0], !!startId, false, startAuto);
    