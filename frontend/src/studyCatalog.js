const topics = (easy, medium, hard) => ({ Easy: easy, Medium: medium, Hard: hard });

export const studyCatalog = {
  CSE: [
    ['Programming in C', topics(
      ['Program structure, variables, and data types', 'Operators and expressions', 'Input, output, and format specifiers'],
      ['Selection statements and loops', 'Functions, scope, and recursion', 'Arrays and strings'],
      ['Pointers and pointer arithmetic', 'Structures, unions, and dynamic memory', 'Files, command-line arguments, and debugging'],
    )],
    ['Data Structures', topics(
      ['Arrays and operations', 'Singly and doubly linked lists', 'Stacks and basic applications'],
      ['Queues and circular queues', 'Trees and binary search trees', 'Hash tables and collision handling'],
      ['AVL trees and balancing', 'Graph traversal with BFS and DFS', 'Shortest paths and minimum spanning trees'],
    )],
    ['Database Management Systems', topics(
      ['Database concepts and relational tables', 'Keys and integrity constraints', 'Basic SQL queries'],
      ['Joins, grouping, and subqueries', 'ER diagrams and relational mapping', 'Functional dependencies and normalization'],
      ['Transactions and ACID properties', 'Concurrency control and recovery', 'Indexing and query optimization'],
    )],
    ['Operating Systems', topics(
      ['Operating system services and structure', 'Processes and process states', 'Files and directories'],
      ['Threads and CPU scheduling', 'Synchronization and semaphores', 'Paging and virtual memory'],
      ['Deadlock detection and avoidance', 'Page replacement analysis', 'File-system implementation and I/O scheduling'],
    )],
    ['Computer Networks', topics(
      ['Network types and topologies', 'OSI and TCP/IP models', 'IPv4 addressing basics'],
      ['Subnetting and routing', 'TCP, UDP, and flow control', 'DNS, HTTP, and application protocols'],
      ['Congestion control and routing algorithms', 'Network security and cryptography basics', 'Performance analysis and troubleshooting'],
    )],
  ],
  ECE: [
    ['Electronic Devices and Circuits', topics(
      ['Semiconductor materials and charge carriers', 'PN junction diode operation', 'Diode rectifiers and clipping circuits'],
      ['BJT operation and configurations', 'BJT biasing and small-signal models', 'MOSFET operation and characteristics'],
      ['Frequency response of amplifiers', 'Feedback amplifiers and oscillators', 'Multistage amplifier analysis'],
    )],
    ['Digital Logic Design', topics(
      ['Binary, octal, and hexadecimal number systems', 'Logic gates and truth tables', 'Boolean algebra basics'],
      ['Karnaugh-map simplification', 'Adders, multiplexers, and decoders', 'Latches, flip-flops, and registers'],
      ['Counters and finite-state machines', 'Timing analysis and hazards', 'Programmable logic design'],
    )],
    ['Signals and Systems', topics(
      ['Common continuous and discrete signals', 'System properties: linearity and time invariance', 'Unit step and impulse signals'],
      ['Convolution and LTI system response', 'Fourier series and frequency spectra', 'Laplace transform and system functions'],
      ['Z-transform and ROC analysis', 'Sampling theorem and reconstruction', 'Stability and frequency-response analysis'],
    )],
    ['Communication Systems', topics(
      ['Communication-system block diagram', 'Amplitude modulation basics', 'Noise and signal-to-noise ratio'],
      ['AM transmitters and receivers', 'Frequency and phase modulation', 'Sampling, quantization, and PCM'],
      ['Digital modulation: PSK, FSK, and QAM', 'Error-control coding basics', 'Link-budget and spectral-efficiency analysis'],
    )],
    ['Microprocessors and Microcontrollers', topics(
      ['Processor architecture and registers', 'Binary arithmetic and flags', 'Basic assembly instructions'],
      ['Addressing modes and instruction timing', 'Interrupts and subroutines', 'Timers and serial communication'],
      ['Peripheral interfacing and bus design', 'Embedded-system memory organization', 'Real-time control and debugging'],
    )],
  ],
  EEE: [
    ['Electrical Circuit Analysis', topics(
      ['Voltage, current, resistance, and power', 'Series and parallel circuits', 'Kirchhoff’s laws'],
      ['Node-voltage and mesh-current methods', 'Thevenin and Norton equivalents', 'AC phasors and resonance'],
      ['Transient response of first- and second-order circuits', 'Laplace methods for network analysis', 'Two-port networks and network functions'],
    )],
    ['Electrical Machines', topics(
      ['Magnetic circuits and electromagnetic induction', 'Transformer parts and operation', 'DC machine construction'],
      ['Transformer equivalent circuits and tests', 'DC motor characteristics and speed control', 'Three-phase induction motor operation'],
      ['Synchronous-machine performance', 'Machine equivalent-circuit analysis', 'Efficiency, losses, and drive selection'],
    )],
    ['Power Systems', topics(
      ['Power-generation sources and station layout', 'Single-line diagrams and system components', 'Transmission and distribution basics'],
      ['Transmission-line parameters and models', 'Per-unit system and power calculations', 'Relays, circuit breakers, and protection zones'],
      ['Load-flow methods and bus classification', 'Fault analysis using sequence networks', 'Stability, economic dispatch, and grid operation'],
    )],
    ['Power Electronics', topics(
      ['Power semiconductor device families', 'Diode rectifier operation', 'Switching-device basics'],
      ['Controlled rectifiers and firing angle', 'DC-DC choppers and converters', 'Single- and three-phase inverters'],
      ['PWM strategies and harmonic analysis', 'Closed-loop converter design', 'Device-loss and thermal calculations'],
    )],
    ['Control Systems', topics(
      ['Open-loop and closed-loop systems', 'Block diagrams and signal flow', 'Transfer functions'],
      ['Time response and steady-state error', 'Root-locus construction', 'Bode and Nyquist plots'],
      ['State-space modelling and controllability', 'Compensator and controller design', 'Stability margins and robust performance'],
    )],
  ],
  MECH: [
    ['Engineering Mechanics', topics(
      ['Units, vectors, and force components', 'Free-body diagrams', 'Equilibrium of a particle'],
      ['Rigid-body equilibrium', 'Friction and simple machines', 'Work-energy and impulse-momentum'],
      ['Distributed forces and centroids', 'Planar kinematics and kinetics', 'Dynamic system and vibration problems'],
    )],
    ['Thermodynamics', topics(
      ['Properties, state, and thermodynamic systems', 'Temperature, pressure, and specific volume', 'First-law energy basics'],
      ['Closed- and open-system energy balances', 'Second law and entropy', 'Ideal-gas and vapour power cycles'],
      ['Exergy and irreversibility analysis', 'Refrigeration and heat-pump cycles', 'Combustion and reacting-system analysis'],
    )],
    ['Strength of Materials', topics(
      ['Stress, strain, and material properties', 'Axial loading and deformation', 'Shear force and bending moment basics'],
      ['Bending and shear stress in beams', 'Torsion of circular shafts', 'Principal stress and Mohr’s circle'],
      ['Beam deflection methods', 'Combined loading and failure theories', 'Buckling of columns and energy methods'],
    )],
    ['Manufacturing Processes', topics(
      ['Engineering materials and manufacturing overview', 'Casting tools and basic moulds', 'Welding process families'],
      ['Casting design and common defects', 'Rolling, forging, and extrusion', 'Turning, drilling, and milling operations'],
      ['Machining-force and tool-life analysis', 'CNC programming and process planning', 'Non-traditional manufacturing processes'],
    )],
    ['Theory of Machines', topics(
      ['Links, kinematic pairs, and mechanisms', 'Velocity diagrams', 'Simple gear trains'],
      ['Acceleration analysis of mechanisms', 'Cam profiles and follower motion', 'Balancing of rotating masses'],
      ['Gyroscopic effects and flywheels', 'Vibration isolation and dampers', 'Dynamic force analysis of machinery'],
    )],
  ],
  CIVIL: [
    ['Engineering Mechanics', topics(
      ['Units, vectors, and force components', 'Free-body diagrams', 'Equilibrium of a particle'],
      ['Rigid-body equilibrium', 'Friction and simple machines', 'Work-energy and impulse-momentum'],
      ['Distributed forces and centroids', 'Planar kinematics and kinetics', 'Dynamic system and vibration problems'],
    )],
    ['Strength of Materials', topics(
      ['Stress, strain, and material properties', 'Axial loading and deformation', 'Shear force and bending moment basics'],
      ['Bending and shear stress in beams', 'Torsion of circular shafts', 'Principal stress and Mohr’s circle'],
      ['Beam deflection methods', 'Combined loading and failure theories', 'Buckling of columns and energy methods'],
    )],
    ['Surveying', topics(
      ['Surveying principles and instruments', 'Chain and tape measurements', 'Compass bearings and field notes'],
      ['Levelling and reduced levels', 'Theodolite traversing', 'Contours, areas, and volumes'],
      ['Traverse adjustment and coordinate methods', 'Total station and GPS surveys', 'Setting out curves and construction surveys'],
    )],
    ['Building Materials and Construction', topics(
      ['Cement types and basic tests', 'Aggregates and concrete ingredients', 'Brick, block, and stone masonry'],
      ['Concrete mix design and workability', 'Foundations and soil preparation', 'Doors, windows, floors, and roofs'],
      ['Reinforced-concrete detailing basics', 'Construction planning and quality control', 'Durability, repair, and sustainable materials'],
    )],
    ['Structural Analysis', topics(
      ['Structural forms, supports, and loads', 'Determinate beams and reactions', 'Shear-force and bending-moment diagrams'],
      ['Analysis of trusses and frames', 'Slope-deflection method', 'Moment-distribution method'],
      ['Influence lines for moving loads', 'Matrix stiffness method', 'Indeterminate structure and stability analysis'],
    )],
  ],
  'CSE (AI&DS)': [
    ['Programming for AI and Data Science', topics(
      ['Python syntax, variables, and data types', 'Conditions, loops, and functions', 'Lists, tuples, and dictionaries'],
      ['Modules, exceptions, and file handling', 'NumPy arrays and vector operations', 'Data cleaning and transformation with pandas'],
      ['Efficient vectorization and profiling', 'Reusable data pipelines and testing', 'Working with large and imperfect datasets'],
    )],
    ['Statistics and Probability', topics(
      ['Mean, median, mode, and variance', 'Basic probability rules', 'Tables and data visualization'],
      ['Common probability distributions', 'Sampling and confidence intervals', 'Correlation and simple regression'],
      ['Hypothesis tests and p-values', 'Bayesian inference fundamentals', 'Experimental design and statistical power'],
    )],
    ['Data Structures and Algorithms', topics(
      ['Arrays, linked lists, stacks, and queues', 'Searching and elementary sorting', 'Algorithm tracing and basic complexity'],
      ['Trees, heaps, and hash tables', 'Graph representations and traversals', 'Recursion and divide-and-conquer'],
      ['Dynamic programming and greedy proofs', 'Advanced graph algorithms', 'Amortized analysis and complexity trade-offs'],
    )],
    ['Machine Learning', topics(
      ['Machine-learning task types and workflow', 'Training and test data', 'Features, labels, and simple baselines'],
      ['Linear and logistic regression', 'Decision trees and ensemble models', 'Metrics, cross-validation, and overfitting'],
      ['Feature engineering and model selection', 'Clustering and dimensionality reduction', 'Fairness, interpretability, and deployment'],
    )],
    ['Artificial Intelligence', topics(
      ['Agents, environments, and problem states', 'State-space search basics', 'Knowledge representation concepts'],
      ['Breadth-first, depth-first, and heuristic search', 'Constraint-satisfaction problems', 'Logic, rules, and inference'],
      ['Adversarial search and game trees', 'Planning under uncertainty', 'Reasoning-system design and evaluation'],
    )],
  ],
  Other: [
    ['Mathematics', topics(
      ['Fractions, ratios, and percentages', 'Algebraic expressions and equations', 'Coordinate graphs and functions'],
      ['Trigonometric ratios and identities', 'Limits and differentiation', 'Integration and applications'],
      ['Sequences, series, and convergence', 'Multivariable calculus basics', 'Differential equations and mathematical modelling'],
    )],
    ['Communication Skills', topics(
      ['Reading for main ideas and detail', 'Grammar and sentence structure', 'Vocabulary and clear everyday writing'],
      ['Paragraph and essay organization', 'Summarizing and paraphrasing', 'Presentations and confident speaking'],
      ['Research writing and source evaluation', 'Formal reports and professional correspondence', 'Debate, argument, and critical communication'],
    )],
    ['Computer Fundamentals', topics(
      ['Computer hardware and software', 'Operating-system and file basics', 'Internet use and digital safety'],
      ['Office and productivity tools', 'Networks, browsers, and cloud services', 'Data organization and backup'],
      ['Privacy, security, and threat awareness', 'Automation and scripting fundamentals', 'Troubleshooting system and network issues'],
    )],
    ['Environmental Studies', topics(
      ['Ecosystems and food chains', 'Natural resources and conservation', 'Types and sources of pollution'],
      ['Biodiversity and habitat protection', 'Waste management and environmental health', 'Climate change and mitigation'],
      ['Environmental impact assessment', 'Resource planning and sustainability metrics', 'Environmental policy and community solutions'],
    )],
    ['Study and Research Skills', topics(
      ['Setting goals and organizing study time', 'Note-taking and active recall', 'Finding and evaluating reliable sources'],
      ['Revision schedules and spaced practice', 'Research questions and basic methods', 'Citations and academic integrity'],
      ['Literature reviews and evidence synthesis', 'Research design and data interpretation', 'Academic writing and project presentation'],
    )],
  ],
};
