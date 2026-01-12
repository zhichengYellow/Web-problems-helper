#include <vector>
#include <string>
using namespace std;

// 编辑距离（Levenshtein）
int editDistance(const string& a, const string& b) {
    int n = (int)a.size(), m = (int)b.size();
    vector<int> dp(m + 1, 0);
    for (int j = 0; j <= m; ++j) dp[j] = j;
    for (int i = 1; i <= n; ++i) {
        int prev = dp[0]; // dp[i-1][0]
        dp[0] = i;
        for (int j = 1; j <= m; ++j) {
            int save = dp[j];
            int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            // 替换：prev + cost，删除：dp[j] + 1，插入：dp[j-1] + 1
            int repl = prev + cost;
            int dele = save + 1;
            int ins = dp[j - 1] + 1;
            int best = repl;
            if (dele < best) best = dele;
            if (ins < best) best = ins;
            dp[j] = best;
            prev = save;
        }
    }
    return dp[m];
}