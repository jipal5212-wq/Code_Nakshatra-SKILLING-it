/**
 * trackTopics.js — server-side mirror of track-data.js
 * Used by publicRoutes to make Execute videos/tasks topic-aligned.
 */
const TRACK_TOPICS = {
  aiml: {
    Beginner: [
      { title:'Python Basics',          skills:['Variables','Loops','Functions','Lists'],              desc:'Write Python scripts that manipulate data and automate tasks.',          ytQuery:'python basics programming project tutorial from scratch' },
      { title:'NumPy & Arrays',         skills:['ndarray','Broadcasting','Indexing','Math ops'],       desc:'Handle multi-dimensional data arrays for numerical computation.',         ytQuery:'numpy arrays python project tutorial from scratch' },
      { title:'Pandas & DataFrames',    skills:['read_csv','groupby','merge','fillna'],                desc:'Load, clean, and transform real-world datasets using Pandas.',          ytQuery:'pandas dataframes data analysis python project tutorial' },
      { title:'Data Visualization',     skills:['Matplotlib','Seaborn','Bar/Line charts','Heatmaps'], desc:'Turn raw data into meaningful visual stories.',                          ytQuery:'data visualization matplotlib seaborn python project tutorial' },
      { title:'Intro to ML',            skills:['scikit-learn','Train/Test split','Pipelines'],       desc:'Understand the ML workflow from data prep to model evaluation.',         ytQuery:'intro machine learning scikit-learn python project tutorial' },
      { title:'Regression Models',      skills:['Linear Reg','Ridge','Lasso','R² score'],             desc:'Build models that predict continuous values from features.',             ytQuery:'linear regression python project tutorial from scratch' },
    ],
    Intermediate: [
      { title:'Neural Networks',        skills:['Perceptron','Backprop','Activation fns','Loss'],     desc:'Understand how deep learning models learn from data.',                  ytQuery:'build neural network from scratch python tutorial' },
      { title:'TensorFlow & Keras',     skills:['Sequential','Dense','Compile','fit()'],              desc:'Build and train neural networks with TensorFlow.',                      ytQuery:'tensorflow keras deep learning project tutorial' },
      { title:'Computer Vision CNN',    skills:['Conv2D','Pooling','ResNet','Transfer Learning'],     desc:'Teach machines to understand and classify images.',                     ytQuery:'CNN image classifier keras tensorflow project tutorial' },
      { title:'Sequence Models RNN',    skills:['LSTM','GRU','Time series','Text seq'],               desc:'Model sequential data like text, speech, and time series.',             ytQuery:'LSTM time series prediction python project tutorial' },
      { title:'NLP Fundamentals',       skills:['Tokenization','TF-IDF','Word2Vec','BERT'],           desc:'Process and understand natural language with machine learning.',         ytQuery:'NLP text classification python BERT project tutorial' },
      { title:'Model Deployment',       skills:['Flask API','Docker','REST endpoints'],               desc:'Ship your ML model as a production-ready API.',                         ytQuery:'deploy machine learning model flask docker project tutorial' },
    ],
    Advanced: [
      { title:'Transformers & Attention',    skills:['Self-attention','BERT','GPT','Fine-tuning'],    desc:'Master the architecture powering modern AI breakthroughs.',             ytQuery:'fine-tune BERT transformers huggingface project tutorial' },
      { title:'LLMs & Prompt Engineering',   skills:['GPT API','RAG','Prompt design','Chaining'],    desc:'Work with large language models to build intelligent apps.',             ytQuery:'build RAG chatbot LLM langchain python project tutorial' },
      { title:'Reinforcement Learning',      skills:['Q-Learning','Policy Gradient','Gym'],          desc:'Train agents that learn from environment interaction.',                  ytQuery:'reinforcement learning python gymnasium project tutorial' },
      { title:'MLOps Pipeline',             skills:['MLflow','DVC','CI/CD','Model registry'],        desc:'Build production ML systems that scale and self-heal.',                 ytQuery:'MLOps pipeline mlflow dvc python project tutorial' },
      { title:'Custom Architectures',       skills:['Custom layers','Research papers','Ablation'],   desc:'Implement state-of-the-art models from research papers.',               ytQuery:'implement research paper neural network pytorch project' },
      { title:'AI Product Launch',          skills:['Product design','UX for AI','Scaling'],         desc:'Ship a complete AI product from concept to users.',                     ytQuery:'build full stack AI product python deployment tutorial' },
    ],
  },
  datascience: {
    Beginner: [
      { title:'Python for Data',        skills:['Python','Jupyter','pip','venv'],                    desc:'Set up a data science environment and write exploratory Python code.',  ytQuery:'python data science jupyter notebook project tutorial' },
      { title:'Pandas Mastery',         skills:['DataFrames','groupby','pivot','merge'],             desc:'Master the most important data manipulation library in Python.',        ytQuery:'pandas data analysis python project tutorial from scratch' },
      { title:'Data Cleaning',          skills:['Missing values','Outliers','Duplicates','Dtypes'],  desc:'Transform messy real-world data into analysis-ready datasets.',          ytQuery:'data cleaning python pandas project tutorial' },
      { title:'Visualization',          skills:['Matplotlib','Seaborn','Plotly','Dashboards'],       desc:'Create charts that communicate insights clearly.',                      ytQuery:'data visualization plotly seaborn python project tutorial' },
      { title:'Statistics Basics',      skills:['Mean/Std','Distributions','Hypothesis','p-value'], desc:'Apply statistical thinking to real data problems.',                     ytQuery:'statistics for data science python hypothesis testing tutorial' },
      { title:'SQL for Data',           skills:['SELECT','JOINs','Window fns','CTEs'],               desc:'Query databases and extract insights with SQL.',                        ytQuery:'SQL data analysis project tutorial from scratch' },
    ],
    Intermediate: [
      { title:'ML for Data Science',    skills:['scikit-learn','Feature engineering','Ensembles'],   desc:'Apply machine learning to extract predictive insights from data.',      ytQuery:'machine learning data science scikit-learn project tutorial' },
      { title:'A/B Testing',            skills:['Experiment design','Sample size','Bayesian'],       desc:'Design and analyse controlled experiments.',                            ytQuery:'AB testing python statistics data science project tutorial' },
      { title:'Feature Engineering',    skills:['Encoding','Scaling','Selection','Interaction'],     desc:'Transform raw features into signals that boost model performance.',     ytQuery:'feature engineering python machine learning project tutorial' },
      { title:'Data Pipelines',         skills:['Airflow','dbt','ETL','Scheduling'],                 desc:'Automate data workflows from source to dashboard.',                     ytQuery:'data pipeline ETL python airflow project tutorial' },
      { title:'Advanced Analytics',     skills:['Forecasting','Anomaly detection','Cohort'],         desc:'Answer complex business questions with advanced analytics.',             ytQuery:'time series forecasting anomaly detection python project tutorial' },
      { title:'Data APIs',              skills:['FastAPI','REST','JSON','Rate limits'],               desc:'Expose your data models and insights via APIs.',                        ytQuery:'build data API FastAPI python project tutorial' },
    ],
    Advanced: [
      { title:'Deep Learning for Data', skills:['Neural nets','Embeddings','Autoencoders','GNNs'],   desc:'Apply deep learning to complex data science problems.',                 ytQuery:'deep learning data science pytorch project tutorial' },
      { title:'Big Data',               skills:['Spark','Databricks','Hadoop','Kafka'],              desc:'Process data at scale with distributed computing.',                     ytQuery:'apache spark big data python project tutorial from scratch' },
      { title:'Production ML',          skills:['MLflow','Monitoring','Drift','Retraining'],         desc:'Deploy and maintain ML models in production.',                          ytQuery:'production ML deployment monitoring mlflow project tutorial' },
      { title:'Causal Inference',       skills:['DoWhy','Propensity score','DiD','IV'],              desc:'Go beyond correlation to understand cause and effect.',                 ytQuery:'causal inference python data science project tutorial' },
      { title:'Custom Models',          skills:['Research papers','Custom loss','Benchmarking'],     desc:'Implement cutting-edge models from data science research.',             ytQuery:'custom ML model python research paper implementation tutorial' },
      { title:'Data Product',           skills:['Dashboards','Storytelling','Stakeholders'],         desc:'Build a full data product that delivers measurable business value.',    ytQuery:'build data product streamlit dashboard python project tutorial' },
    ],
  },
  webdev: {
    Beginner: [
      { title:'HTML Foundations',       skills:['Semantic HTML','Forms','Tables','Accessibility'],   desc:'Build the skeleton of any web page with proper semantic markup.',       ytQuery:'HTML basics project tutorial from scratch build website' },
      { title:'CSS & Layouts',          skills:['Flexbox','Grid','Animations','Variables'],          desc:'Style and layout web pages with modern CSS techniques.',                ytQuery:'CSS flexbox grid layout project tutorial from scratch' },
      { title:'JavaScript Core',        skills:['DOM','Events','Fetch API','ES6+'],                  desc:'Add interactivity and dynamic behaviour to your pages.',                ytQuery:'javascript project tutorial build from scratch DOM' },
      { title:'Responsive Design',      skills:['Media queries','Mobile-first','Viewport'],          desc:'Build interfaces that work beautifully on every screen size.',         ytQuery:'responsive web design project tutorial mobile first CSS' },
      { title:'Git & Version Control',  skills:['Commits','Branches','PRs','GitHub'],                desc:'Manage code history and collaborate with version control.',             ytQuery:'git github project tutorial workflow from scratch' },
      { title:'Dev Tools & Debugging',  skills:['Chrome DevTools','Network tab','Lighthouse'],       desc:'Debug and optimise web apps like a professional.',                      ytQuery:'chrome devtools debugging web development tutorial project' },
    ],
    Intermediate: [
      { title:'React.js',               skills:['Components','Hooks','State','Props'],               desc:'Build component-driven UIs with React.',                                ytQuery:'react js project tutorial build from scratch hooks' },
      { title:'Node.js & Express',      skills:['Routes','Middleware','REST','Error handling'],      desc:'Build server-side applications with JavaScript.',                       ytQuery:'node express REST API project tutorial from scratch' },
      { title:'Databases',              skills:['PostgreSQL','MongoDB','ORMs','Queries'],            desc:'Store and retrieve data with SQL and NoSQL databases.',                 ytQuery:'database postgresql mongodb web project tutorial from scratch' },
      { title:'Authentication',         skills:['JWT','OAuth','Sessions','bcrypt'],                  desc:'Secure your apps with industry-standard auth patterns.',                ytQuery:'JWT authentication node express project tutorial from scratch' },
      { title:'Cloud Deployment',       skills:['Vercel','Railway','Docker','Env vars'],             desc:'Deploy apps to production cloud environments.',                         ytQuery:'deploy web app docker vercel railway project tutorial' },
      { title:'Testing',                skills:['Jest','React Testing Library','E2E','Vitest'],      desc:'Write tests that catch bugs before your users do.',                     ytQuery:'jest react testing library project tutorial from scratch' },
    ],
    Advanced: [
      { title:'System Design',          skills:['Scalability','Load balancing','Caching','CDN'],     desc:'Design large-scale web systems that handle millions of users.',         ytQuery:'system design web app scalability project tutorial' },
      { title:'Performance',            skills:['Code splitting','Lazy load','Web Vitals'],          desc:'Optimise apps for speed, interactivity, and user experience.',         ytQuery:'web performance optimization lighthouse project tutorial' },
      { title:'GraphQL',                skills:['Schema','Resolvers','Apollo','Subscriptions'],      desc:'Build flexible, efficient data APIs with GraphQL.',                     ytQuery:'graphql API apollo project tutorial from scratch' },
      { title:'Micro-frontends',        skills:['Module Federation','Nx','Monorepos'],               desc:'Architect large-scale frontend applications.',                          ytQuery:'micro frontend module federation webpack project tutorial' },
      { title:'Web Security',           skills:['XSS','CSRF','CSP','HTTPS'],                         desc:'Protect your applications from common web vulnerabilities.',            ytQuery:'web security XSS CSRF project tutorial ethical hacking' },
      { title:'OSS & Launch',           skills:['npm publish','Docs','Semver','Community'],          desc:'Ship an open-source project or production SaaS product.',              ytQuery:'publish npm package open source project tutorial from scratch' },
    ],
  },
  robotics: {
    Beginner: [
      { title:'Electronics Basics',     skills:["Ohm's law","Circuits","Breadboard","Multimeter"],   desc:'Understand fundamental electronics concepts for robotics.',             ytQuery:'electronics basics circuits arduino project tutorial' },
      { title:'Arduino Programming',    skills:['setup/loop','digitalRead','PWM','Serial'],          desc:'Program microcontrollers to control physical devices.',                 ytQuery:'arduino programming project tutorial from scratch' },
      { title:'Sensors',                skills:['Ultrasonic','IR','IMU','Temperature'],              desc:'Read real-world data through electronic sensors.',                      ytQuery:'arduino sensors project tutorial ultrasonic IR' },
      { title:'Motors & Actuators',     skills:['DC motors','Servo','Stepper','H-bridge'],           desc:'Control mechanical movement with motors and actuators.',               ytQuery:'arduino motor control servo project tutorial from scratch' },
      { title:'Line Follower',          skills:['PID basics','IR array','Path logic','Tuning'],      desc:'Build a robot that autonomously follows a line on the floor.',          ytQuery:'line follower robot arduino project build from scratch' },
      { title:'Basic Automation',       skills:['State machines','Finite automata','Timing'],        desc:'Create robots that follow programmed behaviour sequences.',             ytQuery:'obstacle avoiding robot arduino project build tutorial' },
    ],
    Intermediate: [
      { title:'Computer Vision',        skills:['OpenCV','Object detection','Color tracking'],       desc:'Give your robot the ability to see and interpret its environment.',     ytQuery:'computer vision robot opencv project tutorial' },
      { title:'ROS Basics',             skills:['Nodes','Topics','Services','roslaunch'],            desc:'Use the Robot Operating System to build modular robot software.',       ytQuery:'ROS robot operating system project tutorial from scratch' },
      { title:'Path Planning',          skills:['A*','Dijkstra','Wavefront','RRT'],                  desc:'Program robots to navigate from A to B autonomously.',                 ytQuery:'A star path planning robot project tutorial python' },
      { title:'PID Control',            skills:['P/I/D gains','Tuning','Error correction'],          desc:'Use feedback control to make robots move precisely.',                   ytQuery:'PID control robot arduino project tutorial from scratch' },
      { title:'SLAM Intro',             skills:['Mapping','Localisation','LiDAR','EKF'],             desc:'Enable a robot to build a map and locate itself within it.',           ytQuery:'SLAM robot mapping localization project tutorial' },
      { title:'Robotic Arm',            skills:['Inverse kinematics','Joint control','Pick & place'],desc:'Control multi-joint arms with kinematics and precision control.',      ytQuery:'robotic arm inverse kinematics project tutorial build' },
    ],
    Advanced: [
      { title:'Multi-Robot Systems',    skills:['Swarm','Communication','Consensus','Fleet'],        desc:'Coordinate fleets of robots working together on shared tasks.',         ytQuery:'swarm robotics multi agent project tutorial simulation' },
      { title:'Deep RL for Robots',     skills:['PPO','SAC','Sim2Real','Reward shaping'],            desc:'Train robots with reinforcement learning in simulation.',               ytQuery:'deep reinforcement learning robot simulation project tutorial' },
      { title:'Advanced SLAM',          skills:['LOAM','ORB-SLAM','Point clouds'],                   desc:'Build robots capable of robust real-world navigation.',                 ytQuery:'ORB-SLAM advanced mapping robot project tutorial' },
      { title:'Custom Firmware',        skills:['FreeRTOS','Interrupts','DMA','Custom HAL'],         desc:'Write optimised firmware for custom embedded hardware.',                ytQuery:'FreeRTOS embedded firmware project tutorial from scratch' },
      { title:'Research Project',       skills:['Paper implementation','Dataset','Benchmarking'],    desc:'Contribute to the frontier of robotics research.',                     ytQuery:'robotics research paper implementation project tutorial' },
      { title:'Full Robot Build',       skills:['Mechanical','Electronics','Software','Testing'],    desc:'Design and build a complete autonomous robot from scratch.',            ytQuery:'build complete autonomous robot project tutorial full build' },
    ],
  },
  cybersec: {
    Beginner: [
      { title:'Networking Basics',      skills:['TCP/IP','DNS','HTTP','Ports'],                      desc:'Understand how the internet and networks actually work.',               ytQuery:'networking basics TCP IP project tutorial wireshark' },
      { title:'Linux CLI',              skills:['bash','chmod','grep','netstat'],                     desc:'Master the command line — the hacker\'s primary tool.',                 ytQuery:'linux command line bash scripting project tutorial' },
      { title:'OWASP Top 10',           skills:['SQL injection','XSS','CSRF','Broken auth'],         desc:'Learn the most critical web application security vulnerabilities.',     ytQuery:'OWASP top 10 web security project tutorial hands-on' },
      { title:'Vulnerability Scanning', skills:['Nmap','Nessus','OpenVAS','CVE'],                    desc:'Find weaknesses in systems before attackers do.',                      ytQuery:'nmap vulnerability scanning project tutorial ethical hacking' },
      { title:'CTF Basics',             skills:['Flags','Steganography','Base64','Ciphers'],         desc:'Compete in Capture The Flag challenges to sharpen offensive skills.',    ytQuery:'CTF challenge walkthrough beginner tutorial TryHackMe' },
      { title:'Password Security',      skills:['Hashing','Salting','Cracking','Managers'],          desc:'Understand how passwords are secured — and broken.',                    ytQuery:'password hashing cracking python project tutorial' },
    ],
    Intermediate: [
      { title:'Penetration Testing',    skills:['Metasploit','Burp Suite','Recon','Exploitation'],   desc:'Conduct structured ethical hacking assessments of systems.',            ytQuery:'penetration testing metasploit burp suite project tutorial' },
      { title:'Web App Security',       skills:['SSRF','XXE','IDOR','JWT attacks'],                  desc:'Attack and defend complex web application vulnerabilities.',            ytQuery:'web application security SSRF IDOR project tutorial' },
      { title:'Malware Analysis',       skills:['Static analysis','Dynamic analysis','Sandbox'],     desc:'Reverse-engineer malicious software to understand its behaviour.',      ytQuery:'malware analysis static dynamic sandbox project tutorial' },
      { title:'Digital Forensics',      skills:['Autopsy','Memory dumps','Log analysis'],            desc:'Investigate security incidents using forensic techniques.',             ytQuery:'digital forensics memory analysis project tutorial' },
      { title:'Network Security',       skills:['Firewall','IDS/IPS','VPN','Segmentation'],          desc:'Secure networks against intrusion and lateral movement.',               ytQuery:'network security firewall IDS project tutorial build' },
      { title:'Exploitation Dev',       skills:['Buffer overflow','Shellcode','ROP','ASLR bypass'],  desc:'Write custom exploits for low-level vulnerabilities.',                  ytQuery:'buffer overflow exploit development project tutorial' },
    ],
    Advanced: [
      { title:'Red Team Ops',           skills:['C2 framework','Lateral movement','Persistence'],    desc:'Simulate sophisticated adversary attacks on enterprise environments.',  ytQuery:'red team operations C2 framework project tutorial' },
      { title:'Zero-Day Research',      skills:['Fuzzing','Source audit','CVE submission'],          desc:'Discover previously unknown vulnerabilities in software.',              ytQuery:'fuzzing zero day vulnerability research project tutorial' },
      { title:'Reverse Engineering',    skills:['Ghidra','Assembly','Anti-debug','Patching'],        desc:'Deconstruct compiled software to understand its inner workings.',       ytQuery:'reverse engineering ghidra assembly project tutorial' },
      { title:'Advanced CTF',           skills:['Pwn','Crypto','Reversing','Web chains'],            desc:'Compete at the elite level of Capture The Flag competitions.',          ytQuery:'advanced CTF pwn crypto reversing project tutorial' },
      { title:'Security Architecture',  skills:['Zero trust','Threat modelling','STRIDE'],           desc:'Design security into systems from the ground up.',                     ytQuery:'security architecture zero trust threat modelling project tutorial' },
      { title:'Incident Response',      skills:['SIEM','Playbooks','Containment','Post-mortem'],     desc:'Lead the response to real and simulated security incidents.',           ytQuery:'incident response SIEM playbook project tutorial build' },
    ],
  },
  iot: {
    Beginner: [
      { title:'Electronics for IoT',    skills:['GPIO','Resistors','Capacitors','Breadboard'],       desc:'Understand the electronic components that power IoT devices.',          ytQuery:'IoT electronics basics GPIO project tutorial' },
      { title:'ESP32 / Arduino',        skills:['setup/loop','WiFi lib','analogRead','JSON'],        desc:'Programme the world\'s most popular IoT microcontrollers.',             ytQuery:'ESP32 arduino IoT project tutorial from scratch' },
      { title:'Sensor Integration',     skills:['DHT22','BMP280','PIR','Ultrasonic'],                desc:'Connect and read data from real-world physical sensors.',               ytQuery:'ESP32 sensor integration project tutorial DHT22' },
      { title:'WiFi Connectivity',      skills:['HTTP client','JSON parsing','WebSockets','OTA'],    desc:'Connect devices to networks and exchange data over WiFi.',              ytQuery:'ESP32 wifi connectivity IoT project tutorial' },
      { title:'MQTT Protocol',          skills:['Publish','Subscribe','Broker','Topics'],            desc:'Use the lightweight IoT messaging protocol for device communication.',  ytQuery:'MQTT protocol ESP32 project tutorial broker' },
      { title:'Basic Dashboard',        skills:['Grafana','InfluxDB','Node-RED','Charts'],           desc:'Visualise IoT sensor data on a live web dashboard.',                   ytQuery:'IoT dashboard grafana node-red project tutorial' },
    ],
    Intermediate: [
      { title:'Edge Computing',         skills:['TensorFlow Lite','Edge Impulse','Local inference'], desc:'Run ML inference directly on microcontrollers without the cloud.',      ytQuery:'edge computing TensorFlow Lite ESP32 project tutorial' },
      { title:'RTOS & Multitasking',    skills:['FreeRTOS','Tasks','Queues','Semaphores'],           desc:'Use real-time operating systems for deterministic IoT behaviour.',      ytQuery:'FreeRTOS IoT multitasking project tutorial ESP32' },
      { title:'LoRa & Long-Range',      skills:['LoRaWAN','Chirpstack','Payload','SF/BW'],           desc:'Transmit sensor data over kilometers with ultra-low power.',            ytQuery:'LoRa LoRaWAN IoT project tutorial from scratch' },
      { title:'Cloud Integration',      skills:['AWS IoT','Firebase','HTTPS','Webhooks'],            desc:'Connect devices to cloud platforms for storage and analytics.',         ytQuery:'AWS IoT firebase cloud integration project tutorial' },
      { title:'Embedded C',             skills:['Pointers','Memory management','HAL','Interrupts'],  desc:'Write efficient low-level firmware in C for embedded systems.',         ytQuery:'embedded C programming IoT project tutorial from scratch' },
      { title:'Power Management',       skills:['Deep sleep','LiPo','Solar','Wake sources'],         desc:'Optimise IoT devices for battery-powered field deployments.',          ytQuery:'ESP32 deep sleep power management IoT project tutorial' },
    ],
    Advanced: [
      { title:'Custom PCB Design',      skills:['KiCad','Schematic','Layout','Gerber'],              desc:'Design and manufacture your own custom circuit boards.',               ytQuery:'custom PCB design KiCad ESP32 project tutorial' },
      { title:'OTA & Fleet Mgmt',       skills:['OTA updates','Fleet dashboard','Provisioning'],     desc:'Manage firmware updates across thousands of deployed devices.',         ytQuery:'OTA firmware update IoT fleet management project tutorial' },
      { title:'ML on the Edge',         skills:['Model quantisation','Edge Impulse','TFLite Micro'], desc:'Deploy sophisticated machine learning models on microcontrollers.',     ytQuery:'machine learning edge microcontroller TFLite project tutorial' },
      { title:'Industrial IoT',         skills:['Modbus','OPC-UA','SCADA','IIoT protocols'],         desc:'Build IoT systems for industrial and manufacturing environments.',      ytQuery:'industrial IoT modbus OPC-UA SCADA project tutorial' },
      { title:'IoT Security',           skills:['TLS/DTLS','Secure boot','Provisioning'],            desc:'Harden IoT devices against physical and network attacks.',             ytQuery:'IoT security TLS secure boot project tutorial' },
      { title:'Full IoT Product',       skills:['HW + FW + Cloud + App','BOM','Certification'],     desc:'Design and launch a complete hardware+software IoT product.',          ytQuery:'full IoT product build hardware software cloud tutorial' },
    ],
  },
};

/**
 * Get track topics for a given skill key and level.
 * @param {string} skillKey  — aiml | datascience | robotics | iot | cybersec | webdev
 * @param {string} level     — Beginner | Intermediate | Advanced
 * @returns {Array|null}
 */
function getTrackTopics(skillKey, level) {
  return (TRACK_TOPICS[skillKey] || {})[level] || null;
}

module.exports = { getTrackTopics, TRACK_TOPICS };
