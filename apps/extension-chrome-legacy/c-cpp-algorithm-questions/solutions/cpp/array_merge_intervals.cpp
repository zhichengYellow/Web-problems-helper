#include <vector>
#include <algorithm>
using namespace std;

// 合并区间：输入/输出均为 [start, end]
struct IntervalCmp {
    bool operator()(const vector<int>& a, const vector<int>& b) const {
        return a[0] < b[0];
    }
};

vector<vector<int> > mergeIntervals(vector<vector<int> > intervals) {
    vector<vector<int> > res;
    if (intervals.empty()) return res;
    sort(intervals.begin(), intervals.end(), IntervalCmp());
    int curL = intervals[0][0], curR = intervals[0][1];
    for (int i = 1; i < (int)intervals.size(); ++i) {
        int L = intervals[i][0], R = intervals[i][1];
        if (L <= curR) {
            curR = (curR > R) ? curR : R;
        } else {
            vector<int> seg; seg.push_back(curL); seg.push_back(curR);
            res.push_back(seg);
            curL = L; curR = R;
        }
    }
    vector<int> seg; seg.push_back(curL); seg.push_back(curR);
    res.push_back(seg);
    return res;
}