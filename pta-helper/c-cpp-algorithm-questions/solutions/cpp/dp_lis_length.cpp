#include <vector>
#include <algorithm>
using namespace std;

// 最长递增子序列长度（O(n log n)）
int lengthOfLIS(const vector<int>& nums) {
    vector<int> tails;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int x = nums[i];
        // lower_bound 替换，保持非降：找到第一个 >= x 的位置
        int l = 0, r = (int)tails.size();
        while (l < r) {
            int m = l + ((r - l) >> 1);
            if (tails[m] >= x) r = m;
            else l = m + 1;
        }
        if (l == (int)tails.size()) tails.push_back(x);
        else tails[l] = x;
    }
    return (int)tails.size();
}