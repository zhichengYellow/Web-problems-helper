#include <cstddef>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v): val(v), next(NULL) {}
};

// 环形链表 II：返回入环点（无环返回 NULL）
ListNode* detectCycle(ListNode* head) {
    if (!head || !head->next) return NULL;
    ListNode* slow = head;
    ListNode* fast = head;
    // 相遇检测
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) break;
    }
    if (!fast || !fast->next) return NULL;
    // 入环点：一指针回到头，同步走
    ListNode* p = head;
    while (p != slow) {
        p = p->next;
        slow = slow->next;
    }
    return p;
}