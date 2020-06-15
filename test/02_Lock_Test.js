const Token = artifacts.require("M4thToken");
const BN = web3.utils.BN;
const truffleAssert = require("truffle-assertions");
// web3.utils.toWei("100000000", "ether")

contract("M4 Token Lock test", async (accounts) => {
    let m4token;
    let owner = accounts[0];
    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];

    let _baseTime = new BN(1585209600);

    function timeout(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }    

    before(async () => {
        m4token = await Token.deployed();
    });       

    describe("테스트 케이스 1 - 관리자 지갑으로 초기 정보 확인", ()=>{

        it("- baseTime 값이 '1585209600' 맞는가?", async () => {
            let baseTime = await m4token.baseTime.call();
            assert.equal(baseTime.toString(), _baseTime.toString(), "baseTime 오류");
        });

        it("- lockedTotalBalance 값이 0 인가?", async () => {
            let baseTime = await m4token.lockedTotalBalance.call();
            assert.equal(baseTime, 0, "lockedTotalBalance 오류");
        });        

        it("- lockedBalanceOf 값이 0 인가?", async () => {
            let baseTime = await m4token.lockedBalanceOf.call();
            assert.equal(baseTime, 0, "lockedBalanceOf 오류");
        });         
        
        it("- lockedBalanceOfByOwner 값이 0 인가?", async () => {
            let baseTime = await m4token.lockedBalanceOfByOwner(user1);
            assert.equal(baseTime, 0, "lockedBalanceOfByOwner 오류");
        });         

        it("- lockedLength 값이 0 인가?", async () => {
            let baseTime = await m4token.lockedLength.call();
            assert.equal(baseTime, 0, "lockedLength 오류");
        });         
        
        it("- lockedLengthByOwner 값이 0 인가?", async () => {
            let baseTime = await m4token.lockedLengthByOwner(user1);
            assert.equal(baseTime, 0, "lockedLengthByOwner 오류");
        });  
    });

    describe("테스트 케이스 2 - 일반 지갑 으로 초기 정보 확인", ()=>{

        it("- baseTime 값이 '1585209600' 맞는가?", async () => {
            let baseTime = await m4token.baseTime.call({from : user2});
            assert.equal(baseTime.toString(), _baseTime.toString(), "baseTime 오류");
        });

        it("- lockedTotalBalance 호출시 권한 오류가 나는가?", async () => {
            await truffleAssert.fails(
              m4token.lockedTotalBalance.call({ from: user2 }),
              truffleAssert.ErrorType.REVERT,
              "Ownable: caller is not the owner"
            );
        });        

        it("- lockedBalanceOf 값이 0 인가?", async () => {
            let baseTime = await m4token.lockedBalanceOf.call({ from: user2 });
            assert.equal(baseTime, 0, "lockedBalanceOf 오류");
        });         
        
        it("- lockedBalanceOfByOwner 호출시 권한 오류가 나는가?", async () => {
            await truffleAssert.fails(
                m4token.lockedBalanceOfByOwner(user1, { from: user2 }),
                truffleAssert.ErrorType.REVERT,
                "Ownable: caller is not the owner"
            );
        });         

        it("- lockedLength 값이 0 인가?", async () => {
            let baseTime = await m4token.lockedLength.call({ from: user2 });
            assert.equal(baseTime, 0, "lockedLength 오류");
        });         
        
        it("- lockedLengthByOwner 호출시 권한 오류가 나는가?", async () => {
            await truffleAssert.fails(
              m4token.lockedLengthByOwner(user1, { from: user2 }),
              truffleAssert.ErrorType.REVERT,
              "Ownable: caller is not the owner"
            );
        });  
    });    


    describe("테스트 케이스 2 - user1 락업 테스트", () => {
        let transferAmount = new BN(web3.utils.toWei("100000000", "ether"));
        let lockAmount1 = new BN(web3.utils.toWei("100", "ether"));
        let lockAmount2 = new BN(web3.utils.toWei("300", "ether"));
        let year = new BN(365 * 24 * 60 * 60);
        let gabTime = new BN(0);

        let towSeconds = new BN(2);
        let fiveSeconds = new BN(10);

        it("- 관리자가 아닌 사람이 락업 설정시 오류 발생?", async () => {
            let now = await m4token.getNow();
            gabTime = now.sub(_baseTime);

            await m4token.transfer(user3, transferAmount);
            await truffleAssert.fails(
              m4token.tokenLock(user3, gabTime.add(towSeconds), lockAmount1, {from : user3}),
              truffleAssert.ErrorType.REVERT,
              "caller is not the owner"
            );     
        });

        it("- 관리자가 아닌 사람이 총 락업 수량 조회시 오류 발생?", async () => {
            await truffleAssert.fails(
              m4token.lockedTotalBalance({from : user3}),
              truffleAssert.ErrorType.REVERT,
              "caller is not the owner"
            );     
        });        

        it("- user1 에게 하나의 락업 설정?", async () => {
            let now = await m4token.getNow();
            gabTime = now.sub(_baseTime);

            await m4token.transfer(user1, transferAmount);
            await m4token.tokenLock(user1, gabTime.add(towSeconds), lockAmount1);

            let _totalLockedAmount = await m4token.lockedTotalBalance();
            //console.log("_total = " + _totalLockedAmount.toString());
            let _user1LockedAmount = await m4token.lockedBalanceOf({from : user1});
            //console.log("_user1LockedAmount = " + _user1LockedAmount.toString());
            let _user1LockedLenghth = await m4token.lockedLength({from : user1});
            //console.log("_user1LockedLenghth = " + _user1LockedLenghth.toString());
            let _lockInfo = await m4token.tokenLockInfo(0, {from: user1});
            //console.log(_lockInfo[0], new BN(_lockInfo[1]).toString(), new BN(_lockInfo[2]).toString());
            let _balance = await m4token.balanceOf(user1);

            assert.equal(_totalLockedAmount.toString(), lockAmount1.toString(), "전체 락 수량 오류");
            assert.equal(_user1LockedAmount.toString(), lockAmount1.toString(), "user1 락 수량 오류");
            assert.equal(_user1LockedLenghth.toString(), "1", "락업 갯수 수량 오류");

            assert.equal(_lockInfo[0], user1, "수령자 주소가 오류");
            assert.equal(_lockInfo[1].toString(), _baseTime.add(gabTime).add(towSeconds).toString(), "release Time 오류");
            assert.equal(_lockInfo[2].toString(), lockAmount1.toString(), "락업 수량 정보 오류");

            assert.equal(new BN(_balance).toString(), transferAmount.sub(lockAmount1).toString(), "락업 후 보유량 오류");
        });          

        it("- user1 에게 두번째 락업 설정?", async () => {

            await m4token.tokenLock(user1, gabTime.add(fiveSeconds), lockAmount2);

            let _totalLockedAmount = await m4token.lockedTotalBalance();
            //console.log("_total = " + _totalLockedAmount.toString());
            let _user1LockedAmount = await m4token.lockedBalanceOf({from : user1});
            //console.log("_user1LockedAmount = " + _user1LockedAmount.toString());
            let _user1LockedLenghth = await m4token.lockedLength({from : user1});
            //console.log("_user1LockedLenghth = " + _user1LockedLenghth.toString());
            let _lockInfo = await m4token.tokenLockInfoByOwner(user1, 1);
            let _balance = await m4token.balanceOf(user1);

            assert.equal(_totalLockedAmount.toString(), lockAmount1.add(lockAmount2).toString(), "전체 락 수량 오류");
            assert.equal(_user1LockedAmount.toString(), lockAmount1.add(lockAmount2).toString(), "user1 락 수량 오류");
            assert.equal(_user1LockedLenghth.toString(), "2", "락업 갯수 수량 오류");

            assert.equal(_lockInfo[0], user1, "수령자 주소가 오류");
            assert.equal(_lockInfo[1].toString(), _baseTime.add(gabTime).add(fiveSeconds).toString(), "release Time 오류");
            assert.equal(_lockInfo[2].toString(), lockAmount2.toString(), "락업 수량 정보 오류");            

            assert.equal(new BN(_balance).toString(), transferAmount.sub(lockAmount1).sub(lockAmount2).toString(), "락업 후 보유량 오류");
        });   
        //timeout(1000);
        it("- user1 자신의 락업 해제하기 1", async () => {    

            await timeout(4000);

            await m4token.tokenUnlock({from : user1});

            let _totalLockedAmount = await m4token.lockedTotalBalance();
            //console.log("_total = " + _totalLockedAmount.toString());
            let _user1LockedAmount = await m4token.lockedBalanceOf({from : user1});
            //console.log("_user1LockedAmount = " + _user1LockedAmount.toString());
            let _user1LockedLenghth = await m4token.lockedLength({from : user1});
            //console.log("_user1LockedLenghth = " + _user1LockedLenghth.toString());           
            let _balance = await m4token.balanceOf(user1);
            //console.log("user1 balance = " + _balance.toString()); 

            assert.equal(_totalLockedAmount.toString(), lockAmount2.toString(), "전체 락 수량 오류");
            assert.equal(_user1LockedAmount.toString(), lockAmount2.toString(), "user1 락 수량 오류");
            assert.equal(_user1LockedLenghth.toString(), "1", "락업 갯수 수량 오류");

            assert.equal(new BN(_balance).toString(), transferAmount.sub(lockAmount2).toString(), "락업 후 보유량 오류");
        });

        it("- 운영자가 아닌 경우 오류가 나는가?", async () => {
            await truffleAssert.fails(
              m4token.tokenUnlockByOwner(user1, {from : user3}),
              truffleAssert.ErrorType.REVERT,
              "caller is not the owner"
            );  
        })

        it("- 운영자가 user1의 락업 해제하기 2", async () => {    

            await timeout(5000);

            await m4token.tokenUnlockByOwner(user1);

            let _totalLockedAmount = await m4token.lockedTotalBalance();
            //console.log("_total = " + _totalLockedAmount.toString());
            let _user1LockedAmount = await m4token.lockedBalanceOf({from : user1});
            //console.log("_user1LockedAmount = " + _user1LockedAmount.toString());
            let _user1LockedLenghth = await m4token.lockedLength({from : user1});
            //console.log("_user1LockedLenghth = " + _user1LockedLenghth.toString());           
            let _balance = await m4token.balanceOf(user1);
            //console.log("user1 balance = " + _balance.toString()); 

            assert.equal(_totalLockedAmount.toString(), "0", "전체 락 수량 오류");
            assert.equal(_user1LockedAmount.toString(), "0", "user1 락 수량 오류");
            assert.equal(_user1LockedLenghth.toString(), "0", "락업 갯수 수량 오류");

            assert.equal(new BN(_balance).toString(), transferAmount.toString(), "락업 후 보유량 오류");            
        });        
    });  
});    