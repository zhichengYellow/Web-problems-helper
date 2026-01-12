#include <vector>
#include <deque>
using namespace std;

// 滑动窗口最大值：O(n) 单调队列
vector<int> maxSlidingWindow(const vector<int>& nums, int k) {
    vector<int> res;
    if (k <= 0 || nums.empty()) return res;
    deque<int> dq; // 存索引，保持对应值递减
    for (int i = 0; i < (int)nums.size(); ++i) {
        // 弹出窗口外的索引
        while (!dq.empty() && dq.front() <= i - k) dq.pop_front();
        // 维护递减：新值更大则弹出尾部
        while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k - 1) res.push_back(nums[dq.front()]);
    }
    return res;
}