// PTA答题助手 - 答案数据库
// 清理版：合并重复条目、统一匹配函数、保留浏览器/Node 导出

const PTA_ANSWER_DATABASE = {
    // 计算机基础知识（扩展）
    computer_basics: {
        '计算机的基本组成包括': 'A',
        'CPU的主要功能是': 'B',
        '内存的作用是': 'C',
        '操作系统的主要功能': 'D',
        '冯·诺依曼体系结构': '存储程序',
        'RAM和ROM的区别': 'RAM易失性，ROM非易失性',
        '计算机五大部件': '运算器、控制器、存储器、输入设备、输出设备',
        'CPU的组成': '运算器、控制器',
        '操作系统的作用': '资源管理、进程调度、内存管理',
        '编译器和解释器的区别': '编译器生成目标代码，解释器逐行执行'
    },

    // 数据结构（扩展）
    data_structure: {
        '栈的特点是': '后进先出',
        '队列的特点是': '先进先出',
        '二叉树的遍历方式': '前序、中序、后序',
        '时间复杂度O(n)': '线性时间复杂度',
        '链表的特点': '动态存储，插入删除高效',
        '哈希表的工作原理': '通过哈希函数映射到数组位置',
        '图的表示方法': '邻接矩阵、邻接表',
        '堆的性质': '完全二叉树，父节点值大于子节点',
        '平衡二叉树': 'AVL树、红黑树',
        'B树和B+树的区别': 'B+树所有数据在叶子节点'
    },

    // 算法（扩展）
    algorithms: {
        '冒泡排序的时间复杂度': 'O(n²)',
        '快速排序的平均时间复杂度': 'O(n log n)',
        '二分查找的时间复杂度': 'O(log n)',
        '深度优先搜索': 'DFS',
        '广度优先搜索': 'BFS',
        '动态规划的特点': '最优子结构、重叠子问题',
        '贪心算法的特点': '局部最优解',
        'Dijkstra算法': '单源最短路径',
        'KMP算法': '字符串匹配',
        '最小生成树算法': 'Prim、Kruskal'
    },

    // 编程基础（扩展）
    programming: {
        'Hello World程序': `#include <stdio.h>
int main() {
    printf("Hello World\\n");
    return 0;
}`,

        // 栈相关编程题
        '顺序栈的操作': `#include <stdio.h>
#include <stdlib.h>

#define MAXSIZE 100

typedef struct {
    int data[MAXSIZE];
    int top;
} Stack;

// 初始化栈
void initStack(Stack *s) {
    s->top = -1;
}

// 入栈
int push(Stack *s, int x) {
    if (s->top >= MAXSIZE - 1) return 0;
    s->data[++s->top] = x;
    return 1;
}

// 出栈
int pop(Stack *s, int *x) {
    if (s->top < 0) return 0;
    *x = s->data[s->top--];
    return 1;
}

int main() {
    Stack s;
    initStack(&s);
    
    int num;
    while (scanf("%d", &num) && num != 0) {
        push(&s, num);
    }
    
    int first = 1;
    while (s.top >= 0) {
        int x;
        pop(&s, &x);
        if (!first) printf(" ");
        printf("%d", x);
        first = 0;
    }
    printf("\\n");
    
    return 0;
}`,

        '栈的基本操作': `#include <stdio.h>
#define MAXSIZE 100

typedef struct {
    int data[MAXSIZE];
    int top;
} Stack;

void initStack(Stack *s) { s->top = -1; }
int push(Stack *s, int x) { 
    if (s->top >= MAXSIZE-1) return 0;
    s->data[++s->top] = x; return 1; 
}
int pop(Stack *s, int *x) { 
    if (s->top < 0) return 0;
    *x = s->data[s->top--]; return 1; 
}`,

        '队列的基本操作': `#include <stdio.h>
#define MAXSIZE 100

typedef struct {
    int data[MAXSIZE];
    int front, rear;
} Queue;

void initQueue(Queue *q) { q->front = q->rear = 0; }
int enqueue(Queue *q, int x) {
    if ((q->rear + 1) % MAXSIZE == q->front) return 0;
    q->data[q->rear] = x;
    q->rear = (q->rear + 1) % MAXSIZE;
    return 1;
}
int dequeue(Queue *q, int *x) {
    if (q->front == q->rear) return 0;
    *x = q->data[q->front];
    q->front = (q->front + 1) % MAXSIZE;
    return 1;
}`,

        '链表基本操作': `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

Node* createList() {
    Node *head = (Node*)malloc(sizeof(Node));
    head->next = NULL;
    return head;
}

void insertNode(Node *head, int data) {
    Node *newNode = (Node*)malloc(sizeof(Node));
    newNode->data = data;
    newNode->next = head->next;
    head->next = newNode;
}

void printList(Node *head) {
    Node *p = head->next;
    while (p) {
        printf("%d ", p->data);
        p = p->next;
    }
    printf("\\n");
}`,

        '二叉树遍历': `#include <stdio.h>
#include <stdlib.h>

typedef struct TreeNode {
    int data;
    struct TreeNode *left, *right;
} TreeNode;

// 前序遍历
void preOrder(TreeNode *root) {
    if (root) {
        printf("%d ", root->data);
        preOrder(root->left);
        preOrder(root->right);
    }
}

// 中序遍历
void inOrder(TreeNode *root) {
    if (root) {
        inOrder(root->left);
        printf("%d ", root->data);
        inOrder(root->right);
    }
}

// 后序遍历
void postOrder(TreeNode *root) {
    if (root) {
        postOrder(root->left);
        postOrder(root->right);
        printf("%d ", root->data);
    }
}`,

        '排序算法': `#include <stdio.h>

// 冒泡排序
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}

// 快速排序
void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return (i + 1);
}`,
        '求两数之和': `int sum(int a, int b) {
    return a + b;
}`,
        '判断素数': `bool isPrime(int n) {
    if (n <= 1) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}`,
        '斐波那契数列': `int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}`,
        '反转字符串': `void reverse(char* str) {
    int len = strlen(str);
    for (int i = 0; i < len/2; i++) {
        char temp = str[i];
        str[i] = str[len-1-i];
        str[len-1-i] = temp;
    }
}`,
        '链表反转': `ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    while (head) {
        ListNode* next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}`
    },

    // 数学（扩展）
    mathematics: {
        '1+1等于': '2',
        '圆的面积公式': 'πr²',
        '勾股定理': 'a²+b²=c²',
        '导数的定义': "f'(x) = lim(h→0) [f(x+h)-f(x)]/h",
        '积分的基本定理': '微积分基本定理',
        '矩阵乘法': '行乘列',
        '概率公式': 'P(A) = n(A)/n(S)',
        '三角函数关系': 'sin²x + cos²x = 1',
        '对数性质': 'log(ab) = loga + logb',
        '排列组合公式': 'C(n,m) = n!/(m!(n-m)!)'
    },

    // 网络技术（扩展）
    network: {
        'TCP/IP协议': '传输控制协议/网际协议',
        'HTTP状态码200': '请求成功',
        'DNS的作用': '域名解析',
        'IP地址的作用': '网络中设备的唯一标识',
        'OSI七层模型': '物理层、数据链路层、网络层、传输层、会话层、表示层、应用层',
        'TCP三次握手': 'SYN、SYN-ACK、ACK',
        'HTTPS加密': 'SSL/TLS',
        '路由器的作用': '网络层设备，路由选择',
        '子网掩码的作用': '划分网络和主机部分',
        'ARP协议': 'IP地址到MAC地址的映射'
    },

    // 数据库（扩展）
    database: {
        'SQL查询语句': 'SELECT * FROM table_name',
        '主键的作用': '唯一标识表中的每一行',
        '外键约束': '维护表间的引用完整性',
        '数据库范式': '1NF, 2NF, 3NF',
        '事务的ACID特性': '原子性、一致性、隔离性、持久性',
        '索引的作用': '加速查询',
        'SQL注入攻击': '通过输入特殊字符破坏查询',
        '连接类型': '内连接、左连接、右连接、全连接',
        '视图的作用': '虚拟表，简化复杂查询',
        '存储过程': '预编译的SQL语句集合'
    },

    // 操作系统
    operating_system: {
        '进程和线程的区别': '进程是资源分配单位，线程是CPU调度单位',
        '死锁的必要条件': '互斥、占有且等待、不可抢占、循环等待',
        '内存管理方式': '分区管理、页式管理、段式管理、段页式管理',
        '页面置换算法': 'FIFO、LRU、OPT',
        '进程调度算法': 'FCFS、SJF、优先级调度、时间片轮转',
        '虚拟内存的作用': '扩展内存容量，实现内存隔离',
        '文件系统的功能': '文件存储、目录管理、文件保护',
        '设备管理方式': '程序I/O、中断驱动I/O、DMA',
        '系统调用和库函数的区别': '系统调用进入内核态，库函数在用户态',
        '多道程序设计': '多个程序同时进入内存，提高CPU利用率'
    },

    // 软件工程
    software_engineering: {
        '软件生命周期阶段': '需求分析、设计、编码、测试、维护',
        '瀑布模型的特点': '线性顺序，阶段明确',
        '敏捷开发原则': '个体和互动、可工作的软件、客户合作、响应变化',
        'UML图的分类': '用例图、类图、时序图、状态图、活动图',
        '黑盒测试和白盒测试的区别': '黑盒关注功能，白盒关注内部结构',
        '单元测试的目的': '验证最小代码单元的正确性',
        '集成测试策略': '自顶向下、自底向上、三明治',
        '软件质量特性': '功能性、可靠性、易用性、效率、可维护性、可移植性',
        '设计模式分类': '创建型、结构型、行为型',
        '重构的目的': '改善代码结构，不改变外部行为'
    },

    // 常见判断题答案（扩展）
    true_false: {
        '计算机只能处理数字信息': false,
        '栈是一种线性数据结构': true,
        'HTTP是安全协议': false,
        '二进制是计算机内部使用的数制': true,
        'Java是编译型语言': false,
        'Python是解释型语言': true,
        '所有编程语言都需要编译器': false,
        '数据库索引总是提高查询性能': false,
        'TCP是面向连接的协议': true,
        'UDP提供可靠传输': false,
        '递归算法一定比迭代算法慢': false,
        '哈希表查找时间复杂度是O(1)': true,
        '快速排序是不稳定的排序算法': true,
        '二叉树的中序遍历是有序的': true,
        '多线程一定比单线程快': false
    },

    // 常见选择题模式（扩展）
    choice_patterns: {
        keywords_to_choice: {
            '全部': 'D',
            '以上都是': 'D',
            '所有': 'D',
            '都不是': 'A',
            '错误': 'A',
            '不正确': 'A',
            '最合适': 'C',
            '最佳': 'C',
            '主要': 'B',
            '基本': 'B',
            '核心': 'B',
            '关键': 'B',
            '首先': 'A',
            '第一步': 'A',
            '最后': 'D',
            '最终': 'D'
        },
        option_patterns: {
            '以上都是|全部|所有': 'D',
            '以上都不是|都不正确': 'A',
            '不确定|不知道': 'C',
            '其他|其他选项': 'D'
        }
    }
};

// ---------- 辅助函数：相似度 & 编辑距离（仅保留一份实现）
function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

function similarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    if (maxLen === 0) return 1;
    const distance = levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
}

// ---------- 统一的答案匹配函数（保留异步 API 回退）
// --- 本地编程题库按需加载支持 ---
let _programmingBankCache = null;
async function loadProgrammingBankIfNeeded() {
    if (_programmingBankCache) return _programmingBankCache;

    // 首先尝试浏览器全局（可能由其他脚本注入）
    if (typeof window !== 'undefined' && window.LOCAL_PROGRAMMING_BANK && window.LOCAL_PROGRAMMING_BANK.programming) {
        _programmingBankCache = window.LOCAL_PROGRAMMING_BANK.programming;
        return _programmingBankCache;
    }

    // 在扩展环境中尝试 fetch JSON 文件
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            const url = chrome.runtime.getURL('c-cpp-algorithm-questions/programming-bank.json');
            const resp = await fetch(url);
            if (resp.ok) {
                const data = await resp.json();
                if (data && typeof data === 'object') {
                    _programmingBankCache = data;
                    return _programmingBankCache;
                }
            }
        }
    } catch (e) {
        console.warn('加载本地编程题库 JSON 失败:', e);
    }

    // Node 环境回退（用于本地脚本/测试）
    try {
        if (typeof require === 'function') {
            // eslint-disable-next-line global-require
            const bank = require('./c-cpp-algorithm-questions/programming-bank.json');
            if (bank && typeof bank === 'object') {
                _programmingBankCache = bank;
                return _programmingBankCache;
            }
        }
    } catch (e) {
        // ignore
    }

    return null;
}

async function getProgrammingAnswerFromBank(questionText) {
    const bank = await loadProgrammingBankIfNeeded();
    if (!bank) return null;

    const text = (questionText || '').toLowerCase();
    // 1) 精确匹配 key
    for (const [k, v] of Object.entries(bank)) {
        if (k.toLowerCase() === text) return v;
    }
    // 2) 包含/相似度匹配
    let best = null; let bestScore = 0;
    for (const [k, v] of Object.entries(bank)) {
        const kproc = k.toLowerCase();
        let score = 0;
        if (text.includes(kproc) || kproc.includes(text)) score = 0.9;
        else score = similarity(text.replace(/[^\w\u4e00-\u9fa5]/g,''), kproc.replace(/[^\w\u4e00-\u9fa5]/g,''));
        if (score > bestScore) { bestScore = score; best = v; }
    }
    if (bestScore > 0.75) return best;
    return null;
}

async function findAnswer(questionText, questionType, options = []) {
    if (!questionText || typeof questionText !== 'string') return null;
    const text = questionText.toLowerCase().replace(/\s+/g, ' ').trim();
    console.log(`🔍 搜索答案: "${text.substring(0, 80)}"`);

    // 1. 精确/包含/关键词匹配本地数据库
    let bestMatch = null;
    let bestScore = 0;
    for (const category of Object.values(PTA_ANSWER_DATABASE)) {
        if (typeof category === 'object' && !Array.isArray(category)) {
            for (const [key, value] of Object.entries(category)) {
                const keyLower = key.toLowerCase();
                let score = 0;
                if (text === keyLower) {
                    score = 100;
                } else if (text.includes(keyLower) && keyLower.length > 3) {
                    score = Math.min(90, (keyLower.length / text.length) * 100);
                } else {
                    const keywords = keyLower.split(/\s+/);
                    const matchedKeywords = keywords.filter(kw => kw.length > 2 && text.includes(kw));
                    score = (matchedKeywords.length / Math.max(1, keywords.length)) * 80;
                }
                if (score > bestScore && score > 50) {
                    bestScore = score;
                    bestMatch = value;
                }
            }
        }
    }
    if (bestMatch) {
        console.log(`✅ 本地数据库匹配成功 (${bestScore.toFixed(1)}%): ${String(bestMatch).slice(0,200)}`);
        return bestMatch;
    }

    // 2. 外部 API 回退（如果可用）
    try {
        if (typeof apiService !== 'undefined' && apiService.isEnabled) {
            console.log('🌐 尝试使用外部API搜索答案...');
            const apiAnswer = await apiService.searchAnswer(questionText, questionType, options);
            if (apiAnswer) return apiAnswer;
        }
    } catch (e) {
        console.warn('API搜索失败，继续本地启发式规则:', e);
    }

    // 3. 单选题启发式匹配
    if (questionType === 'single_choice' && options.length > 0) {
        const patterns = PTA_ANSWER_DATABASE.choice_patterns.keywords_to_choice;
        for (const [keyword, choice] of Object.entries(patterns)) {
            if (text.includes(keyword.toLowerCase())) {
                const targetOption = options.find(opt => opt.value === choice || (opt.text || '').startsWith(choice));
                if (targetOption) return targetOption.value;
            }
        }
        const optionPatterns = PTA_ANSWER_DATABASE.choice_patterns.option_patterns;
        for (const option of options) {
            for (const [pattern, choice] of Object.entries(optionPatterns)) {
                const regex = new RegExp(pattern, 'i');
                if (regex.test(option.text) && option.value === choice) return option.value;
            }
        }
        const comprehensiveOption = options.find(opt => (opt.text||'').includes('以上都是') || (opt.text||'').includes('全部') || (opt.text||'').includes('所有'));
        if (comprehensiveOption) return comprehensiveOption.value;
        const longestOption = options.reduce((prev, cur) => (cur.text?.length||0) > (prev.text?.length||0) ? cur : prev, options[0]);
        if (longestOption && longestOption.text && longestOption.text.length > 20) return longestOption.value;
        const specificOption = options.find(opt => opt.text && ( /\d/.test(opt.text) || /[A-Z]/.test(opt.text) || opt.text.length > 15 ));
        if (specificOption) return specificOption.value;
        const middleOption = options[Math.floor(options.length/2)];
        if (middleOption) return middleOption.value;
    }

    // 4. 判断题启发式
    if (questionType === 'true_false') {
        for (const [key, value] of Object.entries(PTA_ANSWER_DATABASE.true_false || {})) {
            if (text.includes(key.toLowerCase())) return value ? '正确' : '错误';
        }
        const positiveWords = ['是', '可以', '能够', '正确', '对的', 'true', 'yes'];
        const negativeWords = ['不是', '不能', '错误', '错的', 'false', 'no'];
        const positiveCount = positiveWords.filter(w => text.includes(w)).length;
        const negativeCount = negativeWords.filter(w => text.includes(w)).length;
        if (positiveCount > negativeCount) return '正确';
        if (negativeCount > positiveCount) return '错误';
    }

    // 5. 填空/编程题：尝试从题目中提取代码片段
    if (questionType === 'fill_blank' || questionType === 'programming') {
        // 先尝试从本地编程题库加载答案
        try {
            const fromBank = await getProgrammingAnswerFromBank(questionText);
            if (fromBank) {
                console.log('✅ 本地编程题库命中');
                return fromBank;
            }
        } catch (e) {
            console.warn('查询本地编程题库异常:', e);
        }
        const codePatterns = [/(?:代码|程序|函数|实现)[:：]\s*([^{}]+{[\s\S]+?})/, /(?:编写|实现|完成)[:：]\s*([^{}]+{[\s\S]+?})/, /(?:示例|例子)[:：]\s*([^{}]+{[\s\S]+?})/];
        for (const p of codePatterns) {
            const m = questionText.match(p);
            if (m && m[1]) return m[1];
        }
    }

    // 6. 最后尝试使用宽松的相似度匹配（增强版）
    const processedText = questionText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '').trim();
    for (const category in PTA_ANSWER_DATABASE) {
        const categoryData = PTA_ANSWER_DATABASE[category];
        for (const [question, answer] of Object.entries(categoryData)) {
            const processedQuestion = question.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '').trim();
            if (processedText.includes(processedQuestion) || processedQuestion.includes(processedText) || similarity(processedText, processedQuestion) > 0.75) {
                console.log(`✅ 宽松匹配到答案 (${category}): ${String(answer).slice(0,200)}`);
                return answer;
            }
        }
    }

    console.log('❌ 未找到匹配的答案');
    return null;
}

// 导出兼容浏览器与 Node 环境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PTA_ANSWER_DATABASE, findAnswer };
} else {
    window.PTA_ANSWER_DATABASE = PTA_ANSWER_DATABASE;
    window.findAnswer = findAnswer;
}