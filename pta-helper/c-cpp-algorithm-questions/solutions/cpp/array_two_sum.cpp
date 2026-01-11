#include <vector>
#include <unordered_map>
using namespace std;

// 两数之和：返回索引对（任意一个解）
vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int,int> pos;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int need = target - nums[i];
        auto it = pos.find(need);
        if (it != pos.end()) { vector<int> ans; ans.push_back(it->second); ans.push_back(i); return ans; }
        pos[nums[i]] = i;
    }
    return vector<int>();
}