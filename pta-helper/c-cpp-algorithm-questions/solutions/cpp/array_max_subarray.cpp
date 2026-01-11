#include <vector>
using namespace std;

// 最大子数组和（Kadane）
int maxSubArray(const vector<int>& nums) {
    if (nums.empty()) return 0;
    int best = nums[0];
    int cur = nums[0];
    for (int i = 1; i < (int)nums.size(); ++i) {
        cur = (cur + nums[i] > nums[i]) ? (cur + nums[i]) : nums[i];
        best = (best > cur) ? best : cur;
    }
    return best;
}