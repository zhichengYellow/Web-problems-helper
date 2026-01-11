#include <vector>
using namespace std;

// 删除排序数组中的重复项：原地去重并返回新长度
int removeDuplicates(vector<int>& nums) {
    if (nums.empty()) return 0;
    int slow = 1;
    for (int fast = 1; fast < (int)nums.size(); ++fast) {
        if (nums[fast] != nums[fast - 1]) {
            nums[slow++] = nums[fast];
        }
    }
    return slow;
}