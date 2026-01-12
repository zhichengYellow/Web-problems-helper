/**
 * 编程题答案搜索增强模块
 * 专门优化编程题的答案搜索和匹配功能
 */

class ProgrammingAnswerEnhancer {
    constructor() {
        this.programmingPatterns = {
            // 栈相关题目模式
            stack: {
                keywords: ['栈', 'stack', '后进先出', 'LIFO', '入栈', '出栈', 'push', 'pop'],
                templates: {
                    '顺序栈': this.getStackTemplate(),
                    '栈的操作': this.getStackTemplate(),
                    '栈的基本操作': this.getStackTemplate()
                }
            },
            
            // 队列相关题目模式
            queue: {
                keywords: ['队列', 'queue', '先进先出', 'FIFO', '入队', '出队', 'enqueue', 'dequeue'],
                templates: {
                    '队列操作': this.getQueueTemplate(),
                    '循环队列': this.getCircularQueueTemplate()
                }
            },
            
            // 链表相关题目模式
            linkedList: {
                keywords: ['链表', 'linked list', '单链表', '双链表', '节点', 'node'],
                templates: {
                    '链表操作': this.getLinkedListTemplate(),
                    '链表反转': this.getLinkedListReverseTemplate()
                }
            },
            
            // 树相关题目模式
            tree: {
                keywords: ['二叉树', 'binary tree', '遍历', 'traversal', '前序', '中序', '后序', '重建二叉树'],
                templates: {
                    '二叉树遍历': this.getTreeTraversalTemplate(),
                    '二叉搜索树': this.getBSTTemplate()
                }
            },

            // 图相关题目模式
            graph: {
                keywords: ['图', 'graph', '顶点', 'vertex', '边', 'edge', '邻接', 'adjacency', 'bfs', 'dfs', '广度优先', '深度优先', '最短路径', 'dijkstra', '拓扑排序'],
                templates: {
                    '图的遍历': this.getGraphTraversalTemplate(),
                    '最短路径': this.getDijkstraTemplate()
                }
            },
            
            // 排序算法模式
            sorting: {
                keywords: ['排序', 'sort', '冒泡', 'bubble', '快速', 'quick', '选择', 'selection'],
                templates: {
                    '冒泡排序': this.getBubbleSortTemplate(),
                    '快速排序': this.getQuickSortTemplate(),
                    '选择排序': this.getSelectionSortTemplate()
                }
            }
        };
        
        // 编程题答案数据库扩展
        this.programmingAnswers = this.initProgrammingAnswers();

        // 本地编程题题库（传统数据结构）
        try {
            if (typeof LOCAL_PROGRAMMING_BANK !== 'undefined') {
                this.localProgrammingBank = LOCAL_PROGRAMMING_BANK;
            } else if (typeof window !== 'undefined' && window.LOCAL_PROGRAMMING_BANK) {
                this.localProgrammingBank = window.LOCAL_PROGRAMMING_BANK;
            } else {
                this.localProgrammingBank = [];
            }
        } catch (e) {
            this.localProgrammingBank = [];
        }

        // 如果未在全局找到题库，尝试按需加载位于扩展资源目录下的题库文件
        try {
            this.loadLocalBankIfNeeded();
        } catch (e) {
            // ignore
        }
    }

    // 异步加载本地题库（如果未直接注入到 window）
    async loadLocalBankIfNeeded() {
        try {
            // 尝试加载 JSON 格式的题库 (CSP 安全)
            const url = chrome && chrome.runtime ? chrome.runtime.getURL('c-cpp-algorithm-questions/programming-bank.json') : null;
            if (!url) return;
            
            console.log('正在尝试加载本地题库 JSON:', url);
            const resp = await fetch(url);
            if (!resp.ok) {
                console.error('加载本地题库 JSON 响应错误:', resp.status, resp.statusText);
                return;
            }
            
            const data = await resp.json();
            if (data && typeof data === 'object') {
                // 合并到 programmingAnswers
                this.programmingAnswers = { ...this.programmingAnswers, ...data };
                console.log('✅ 本地编程题题库(JSON)已按需加载，条目数=', Object.keys(data).length);
            }
        } catch (e) {
            console.warn('加载本地题库失败:', e);
        }
    }

    /**
     * 增强编程题答案搜索
     */
    async enhanceAnswerSearch(questionText, questionMeta = null) {
        console.log('🔍 开始增强编程题答案搜索...');
        
        try {
            // 1. 精确匹配
            const exactMatch = this.findExactMatch(questionText);
            if (exactMatch) {
                console.log('✅ 找到精确匹配答案');
                return {
                    success: true,
                    answer: exactMatch,
                    method: 'exact_match',
                    confidence: 0.95
                };
            }
            
            // 2. 模式匹配
            const patternMatch = this.findPatternMatch(questionText, questionMeta);
            if (patternMatch) {
                console.log('✅ 找到模式匹配答案');
                return {
                    success: true,
                    answer: patternMatch.code,
                    method: 'pattern_match',
                    confidence: patternMatch.confidence,
                    pattern: patternMatch.pattern
                };
            }
            
            // 3. 关键词匹配
            const keywordMatch = this.findKeywordMatch(questionText);
            if (keywordMatch) {
                console.log('✅ 找到关键词匹配答案');
                return {
                    success: true,
                    answer: keywordMatch.code,
                    method: 'keyword_match',
                    confidence: keywordMatch.confidence,
                    keywords: keywordMatch.keywords
                };
            }
            
            // 4. 模板生成
            const templateMatch = this.generateTemplate(questionText, questionMeta);
            if (templateMatch) {
                console.log('✅ 生成模板答案');
                return {
                    success: true,
                    answer: templateMatch.code,
                    method: 'template_generation',
                    confidence: 0.6,
                    template: templateMatch.template
                };
            }
            
            return {
                success: false,
                error: '未找到匹配的编程题答案'
            };
            
        } catch (error) {
            console.error('编程题答案搜索失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 精确匹配搜索
     */
    findExactMatch(questionText) {
        if (!questionText || questionText.length < 2) return null;
        
        const normalizedQuestion = this.normalizeText(questionText);
        if (!normalizedQuestion) return null;
        
        // 从答案数据库中查找
        if (typeof WPH_ANSWER_DATABASE !== 'undefined' && WPH_ANSWER_DATABASE.programming) {
            for (const [key, value] of Object.entries(WPH_ANSWER_DATABASE.programming)) {
                const normalizedKey = this.normalizeText(key);
                if (normalizedKey && (normalizedQuestion.includes(normalizedKey) || normalizedKey.includes(normalizedQuestion))) {
                    return value;
                }
            }
        }
        
        // 从本地编程答案库中查找
        for (const [key, value] of Object.entries(this.programmingAnswers)) {
            const normalizedKey = this.normalizeText(key);
            if (normalizedKey && (normalizedQuestion.includes(normalizedKey) || normalizedKey.includes(normalizedQuestion))) {
                return value;
            }
        }
        
        // 检查本地编程题题库（结构化条目）
        for (const item of (this.localProgrammingBank || [])) {
            const normalizedTitle = this.normalizeText(item.title || item.id || '');
            if (normalizedTitle && (normalizedQuestion.includes(normalizedTitle) || normalizedTitle.includes(normalizedQuestion))) {
                return item.codeTemplate || null;
            }
            // 尝试标签匹配
            if (item.tags && item.tags.some(t => {
                const nt = t.toLowerCase();
                return nt && normalizedQuestion.includes(nt);
            })) {
                return item.codeTemplate || null;
            }
        }
        
        return null;
    }

    /**
     * 模式匹配搜索
     */
    findPatternMatch(questionText, questionMeta) {
        const normalizedQuestion = this.normalizeText(questionText);
        let bestMatch = null;
        let maxScore = 0;
        
        for (const [patternName, pattern] of Object.entries(this.programmingPatterns)) {
            const score = this.calculatePatternScore(normalizedQuestion, pattern, questionMeta);
            
            if (score > maxScore && score > 0.3) {
                maxScore = score;
                
                // 查找最佳模板
                const template = this.findBestTemplate(normalizedQuestion, pattern.templates);
                if (template) {
                    bestMatch = {
                        code: template,
                        confidence: score,
                        pattern: patternName
                    };
                }
            }
        }
        
        return bestMatch;
    }

    /**
     * 关键词匹配搜索
     */
    findKeywordMatch(questionText) {
        const normalizedQuestion = this.normalizeText(questionText);
        const matchedKeywords = [];
        let bestMatch = null;
        let maxScore = 0;
        
        for (const [patternName, pattern] of Object.entries(this.programmingPatterns)) {
            const keywordScore = pattern.keywords.reduce((score, keyword) => {
                if (normalizedQuestion.includes(keyword.toLowerCase())) {
                    matchedKeywords.push(keyword);
                    return score + 1;
                }
                return score;
            }, 0);
            
            if (keywordScore > maxScore) {
                maxScore = keywordScore;
                const template = Object.values(pattern.templates)[0]; // 使用第一个模板
                if (template) {
                    bestMatch = {
                        code: template,
                        confidence: Math.min(keywordScore / pattern.keywords.length, 0.8),
                        keywords: matchedKeywords
                    };
                }
            }
        }
        
        return bestMatch;
    }

    /**
     * 模板生成
     */
    generateTemplate(questionText, questionMeta) {
        const normalizedQuestion = this.normalizeText(questionText);
        
        // 基于题目内容生成基础模板
        if (normalizedQuestion.includes('输入') && normalizedQuestion.includes('输出')) {
            return {
                code: this.getBasicIOTemplate(),
                template: 'basic_io'
            };
        }
        
        if (normalizedQuestion.includes('数组') || normalizedQuestion.includes('array')) {
            return {
                code: this.getArrayTemplate(),
                template: 'array'
            };
        }
        
        if (normalizedQuestion.includes('字符串') || normalizedQuestion.includes('string')) {
            return {
                code: this.getStringTemplate(),
                template: 'string'
            };
        }
        
        // 默认模板
        return {
            code: this.getDefaultTemplate(),
            template: 'default'
        };
    }

    /**
     * 计算模式匹配分数
     */
    calculatePatternScore(questionText, pattern, questionMeta) {
        let score = 0;
        
        // 关键词匹配分数
        const keywordMatches = pattern.keywords.filter(keyword => 
            questionText.includes(keyword.toLowerCase())
        ).length;
        score += (keywordMatches / pattern.keywords.length) * 0.6;
        
        // 元数据匹配分数
        if (questionMeta) {
            if (questionMeta.type && pattern.keywords.includes(questionMeta.type)) {
                score += 0.2;
            }
            
            if (questionMeta.tags) {
                const tagMatches = questionMeta.tags.filter(tag => 
                    pattern.keywords.some(keyword => keyword.includes(tag.toLowerCase()))
                ).length;
                score += (tagMatches / questionMeta.tags.length) * 0.2;
            }
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * 查找最佳模板
     */
    findBestTemplate(questionText, templates) {
        let bestTemplate = null;
        let maxScore = 0;
        
        for (const [templateName, templateCode] of Object.entries(templates)) {
            const normalizedName = this.normalizeText(templateName);
            let score = 0;
            
            // 计算模板名称与题目的相似度
            const nameWords = normalizedName.split(/\s+/);
            const questionWords = questionText.split(/\s+/);
            
            const commonWords = nameWords.filter(word => 
                questionWords.some(qWord => qWord.includes(word) || word.includes(qWord))
            ).length;
            
            score = commonWords / Math.max(nameWords.length, questionWords.length);
            
            if (score > maxScore) {
                maxScore = score;
                bestTemplate = templateCode;
            }
        }
        
        return bestTemplate || Object.values(templates)[0]; // 返回最佳匹配或第一个模板
    }

    /**
     * 文本标准化
     */
    normalizeText(text) {
        return text.toLowerCase()
                  .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
    }

    /**
     * 初始化编程答案数据库
     */
    initProgrammingAnswers() {
        return {
            '7-1 顺序栈的操作': this.getStackTemplate(),
            '线性表逆置': this.getArrayReverseTemplate(),
            '链表建立': this.getLinkedListTemplate(),
            '二叉树建立': this.getTreeBuildTemplate(),
            '图的遍历': this.getGraphTraversalTemplate(),
            '最短路径': this.getDijkstraTemplate(),
            '排序算法实现': this.getSortingTemplate(),
            '查找算法': this.getSearchTemplate(),
            '动态规划': this.getDPTemplate(),
            '贪心算法': this.getGreedyTemplate()
        };
    }

    // ==================== 代码模板方法 ====================

    getStackTemplate() {
        return `#include <stdio.h>
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
}`;
    }

    getQueueTemplate() {
        return `#include <stdio.h>
#define MAXSIZE 100

typedef struct {
    int data[MAXSIZE];
    int front, rear;
} Queue;

void initQueue(Queue *q) {
    q->front = q->rear = 0;
}

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
}

int main() {
    Queue q;
    initQueue(&q);
    
    // 在这里实现具体逻辑
    
    return 0;
}`;
    }

    getCircularQueueTemplate() {
        return this.getQueueTemplate(); // 循环队列使用相同模板
    }

    getLinkedListTemplate() {
        return `#include <stdio.h>
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
}

int main() {
    Node *head = createList();
    
    // 在这里实现具体逻辑
    
    return 0;
}`;
    }

    getLinkedListReverseTemplate() {
        return `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

Node* reverseList(Node *head) {
    Node *prev = NULL;
    Node *current = head;
    Node *next = NULL;
    
    while (current != NULL) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    
    return prev;
}

int main() {
    // 在这里实现具体逻辑
    
    return 0;
}`;
    }

    getTreeTraversalTemplate() {
        return `#include <stdio.h>
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
}

int main() {
    // 在这里实现具体逻辑
    
    return 0;
}`;
    }

    getBSTTemplate() {
        return `#include <stdio.h>
#include <stdlib.h>

typedef struct TreeNode {
    int data;
    struct TreeNode *left, *right;
} TreeNode;

TreeNode* insert(TreeNode *root, int data) {
    if (root == NULL) {
        TreeNode *newNode = (TreeNode*)malloc(sizeof(TreeNode));
        newNode->data = data;
        newNode->left = newNode->right = NULL;
        return newNode;
    }
    
    if (data < root->data) {
        root->left = insert(root->left, data);
    } else if (data > root->data) {
        root->right = insert(root->right, data);
    }
    
    return root;
}

TreeNode* search(TreeNode *root, int data) {
    if (root == NULL || root->data == data) {
        return root;
    }
    
    if (data < root->data) {
        return search(root->left, data);
    }
    
    return search(root->right, data);
}

int main() {
    TreeNode *root = NULL;
    
    // 在这里实现具体逻辑
    
    return 0;
}`;
    }

    getBubbleSortTemplate() {
        return `#include <stdio.h>

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

void printArray(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}

int main() {
    int n;
    scanf("%d", &n);
    int arr[n];
    
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    
    bubbleSort(arr, n);
    printArray(arr, n);
    
    return 0;
}`;
    }

    getQuickSortTemplate() {
        return `#include <stdio.h>

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
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    int n;
    scanf("%d", &n);
    int arr[n];
    
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    
    quickSort(arr, 0, n-1);
    
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    return 0;
}`;
    }

    getSelectionSortTemplate() {
        return `#include <stdio.h>

void selectionSort(int arr[], int n) {
    for (int i = 0; i < n-1; i++) {
        int min_idx = i;
        for (int j = i+1; j < n; j++) {
            if (arr[j] < arr[min_idx]) {
                min_idx = j;
            }
        }
        int temp = arr[min_idx];
        arr[min_idx] = arr[i];
        arr[i] = temp;
    }
}

int main() {
    int n;
    scanf("%d", &n);
    int arr[n];
    
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    
    selectionSort(arr, n);
    
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    return 0;
}`;
    }

    getBasicIOTemplate() {
        return `#include <stdio.h>

int main() {
    // 读取输入
    int n;
    scanf("%d", &n);
    
    // 处理逻辑
    // TODO: 在这里实现具体功能
    
    // 输出结果
    printf("%d\\n", n);
    
    return 0;
}`;
    }

    getArrayTemplate() {
        return `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int arr[n];
    
    // 读取数组
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    
    // 处理数组
    // TODO: 在这里实现具体功能
    
    // 输出数组
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    return 0;
}`;
    }

    getStringTemplate() {
        return `#include <stdio.h>
#include <string.h>

int main() {
    char str[1000];
    fgets(str, sizeof(str), stdin);
    
    // 处理字符串
    // TODO: 在这里实现具体功能
    
    printf("%s", str);
    
    return 0;
}`;
    }

    getDefaultTemplate() {
        return `#include <stdio.h>
#include <stdlib.h>

int main() {
    // TODO: 在这里实现具体功能
    
    return 0;
}`;
    }

    // 其他模板方法...
    getArrayReverseTemplate() {
        return `#include <stdio.h>

void reverseArray(int arr[], int n) {
    for (int i = 0; i < n/2; i++) {
        int temp = arr[i];
        arr[i] = arr[n-1-i];
        arr[n-1-i] = temp;
    }
}

int main() {
    int n;
    scanf("%d", &n);
    int arr[n];
    
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    
    reverseArray(arr, n);
    
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    return 0;
}`;
    }

    getTreeBuildTemplate() {
        return this.getTreeTraversalTemplate();
    }

    getGraphTraversalTemplate() {
        return `#include <stdio.h>
#include <stdlib.h>

#define MAX_VERTICES 100

int graph[MAX_VERTICES][MAX_VERTICES];
int visited[MAX_VERTICES];
int n; // 顶点数

void DFS(int v) {
    visited[v] = 1;
    printf("%d ", v);
    
    for (int i = 0; i < n; i++) {
        if (graph[v][i] && !visited[i]) {
            DFS(i);
        }
    }
}

void BFS(int start) {
    int queue[MAX_VERTICES];
    int front = 0, rear = 0;
    
    visited[start] = 1;
    queue[rear++] = start;
    
    while (front < rear) {
        int v = queue[front++];
        printf("%d ", v);
        
        for (int i = 0; i < n; i++) {
            if (graph[v][i] && !visited[i]) {
                visited[i] = 1;
                queue[rear++] = i;
            }
        }
    }
}

int main() {
    // 在这里实现具体逻辑
    
    return 0;
}`;
    }

    getDijkstraTemplate() {
        return `#include <stdio.h>
#include <limits.h>

#define MAX_VERTICES 100
#define INF INT_MAX

int graph[MAX_VERTICES][MAX_VERTICES];
int dist[MAX_VERTICES];
int visited[MAX_VERTICES];
int n;

int minDistance() {
    int min = INF, min_index;
    
    for (int v = 0; v < n; v++) {
        if (!visited[v] && dist[v] <= min) {
            min = dist[v];
            min_index = v;
        }
    }
    
    return min_index;
}

void dijkstra(int src) {
    for (int i = 0; i < n; i++) {
        dist[i] = INF;
        visited[i] = 0;
    }
    
    dist[src] = 0;
    
    for (int count = 0; count < n - 1; count++) {
        int u = minDistance();
        visited[u] = 1;
        
        for (int v = 0; v < n; v++) {
            if (!visited[v] && graph[u][v] && 
                dist[u] != INF && dist[u] + graph[u][v] < dist[v]) {
                dist[v] = dist[u] + graph[u][v];
            }
        }
    }
}

int main() {
    // 在这里实现具体逻辑
    
    return 0;
}`;
    }

    getSortingTemplate() {
        return this.getBubbleSortTemplate();
    }

    getSearchTemplate() {
        return `#include <stdio.h>

// 线性查找
int linearSearch(int arr[], int n, int x) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == x) {
            return i;
        }
    }
    return -1;
}

// 二分查找
int binarySearch(int arr[], int l, int r, int x) {
    if (r >= l) {
        int mid = l + (r - l) / 2;
        
        if (arr[mid] == x) {
            return mid;
        }
        
        if (arr[mid] > x) {
            return binarySearch(arr, l, mid - 1, x);
        }
        
        return binarySearch(arr, mid + 1, r, x);
    }
    
    return -1;
}

int main() {
    // 在这里实现具体逻辑
    
    return 0;
}`;
    }

    getDPTemplate() {
        return `#include <stdio.h>
#include <string.h>

int dp[1000][1000];

int main() {
    // 初始化DP数组
    memset(dp, -1, sizeof(dp));
    
    // 在这里实现动态规划逻辑
    
    return 0;
}`;
    }

    getGreedyTemplate() {
        return `#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int value;
    int weight;
    double ratio;
} Item;

int compare(const void *a, const void *b) {
    Item *itemA = (Item *)a;
    Item *itemB = (Item *)b;
    return (itemB->ratio > itemA->ratio) - (itemB->ratio < itemA->ratio);
}

int main() {
    // 在这里实现贪心算法逻辑
    
    return 0;
}`;
    }
}

// 导出增强器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgrammingAnswerEnhancer;
} else if (typeof window !== 'undefined') {
    window.ProgrammingAnswerEnhancer = ProgrammingAnswerEnhancer;
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.programmingAnswerEnhancer = new ProgrammingAnswerEnhancer();
    console.log('✅ 编程题答案搜索增强器已加载');
}