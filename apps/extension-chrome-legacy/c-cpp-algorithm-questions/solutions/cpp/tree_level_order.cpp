#include <vector>
#include <queue>
using namespace std;

struct TreeNode { int val; TreeNode *left, *right; TreeNode(int v):val(v),left(NULL),right(NULL){} };

// 层序遍历：返回每层节点值
vector<vector<int> > levelOrder(TreeNode* root) {
    vector<vector<int> > res;
    if (!root) return res;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        int sz = (int)q.size();
        vector<int> level; level.reserve(sz);
        while (sz--) {
            TreeNode* cur = q.front(); q.pop();
            level.push_back(cur->val);
            if (cur->left) q.push(cur->left);
            if (cur->right) q.push(cur->right);
        }
        res.push_back(level);
    }
    return res;
}