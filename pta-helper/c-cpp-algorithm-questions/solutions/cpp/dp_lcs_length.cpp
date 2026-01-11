#include <vector>
#include <string>
using namespace std;

// 最长公共子序列长度（LCS）
int lcsLength(const string& a, const string& b) {
    int n = (int)a.size(), m = (int)b.size();
    vector<int> dp(m + 1, 0);
    for (int i = 1; i <= n; ++i) {
        int prev = 0; // dp[i-1][j-1]
        for (int j = 1; j <= m; ++j) {
            int tmp = dp[j];
            if (a[i - 1] == b[j - 1]) dp[j] = prev + 1;
            else dp[j] = (dp[j] > dp[j - 1]) ? dp[j] : dp[j - 1];
            prev = tmp;
        }
    }
    return dp[m];
}