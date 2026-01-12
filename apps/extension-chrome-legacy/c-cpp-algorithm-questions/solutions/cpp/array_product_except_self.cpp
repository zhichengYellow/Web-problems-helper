#include <vector>
using namespace std;

// 除自身以外数组的乘积（不使用除法）
vector<int> productExceptSelf(const vector<int>& nums) {
    int n = (int)nums.size();
    vector<int> res(n, 1);
    // 前缀乘积
    int pre = 1;
    for (int i = 0; i < n; ++i) {
        res[i] = pre;
        pre *= nums[i];
    }
    // 后缀乘积
    int suf = 1;
    for (int i = n - 1; i >= 0; --i) {
        res[i] *= suf;
        suf *= nums[i];
    }
    return res;
}