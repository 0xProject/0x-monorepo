/*

  Copyright 2020 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;

library SafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "MUL_ERROR");

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "DIVIDING_ERROR");
        return a / b;
    }

    function divCeil(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 quotient = div(a, b);
        uint256 remainder = a - quotient * b;
        if (remainder > 0) {
            return quotient + 1;
        } else {
            return quotient;
        }
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SUB_ERROR");
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "ADD_ERROR");
        return c;
    }

    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = x / 2 + 1;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}

library DecimalMath {
    using SafeMath for uint256;

    uint256 constant ONE = 10**18;

    function mul(uint256 target, uint256 d) internal pure returns (uint256) {
        return target.mul(d) / ONE;
    }

    function divFloor(uint256 target, uint256 d) internal pure returns (uint256) {
        return target.mul(ONE).div(d);
    }

    function divCeil(uint256 target, uint256 d) internal pure returns (uint256) {
        return target.mul(ONE).divCeil(d);
    }
}

library DODOMath {
    using SafeMath for uint256;
    uint256 constant ONE = 10**18;

    /*
        Integrate dodo curve fron V1 to V2
        require V0>=V1>=V2>0
        res = (1-k)i(V1-V2)+ikV0*V0(1/V2-1/V1)
        let V1-V2=delta
        res = i*delta*(1-k+k(V0^2/V1/V2))
    */
    function _GeneralIntegrate(
        uint256 V0,
        uint256 V1,
        uint256 V2,
        uint256 i,
        uint256 k
    ) internal pure returns (uint256) {
        uint256 fairAmount = DecimalMath.mul(i, V1.sub(V2)); // i*delta
        uint256 V0V0V1V2 = DecimalMath.divCeil(V0.mul(V0).div(V1), V2);
        uint256 penalty = DecimalMath.mul(k, V0V0V1V2); // k(V0^2/V1/V2)
        return DecimalMath.mul(fairAmount, ONE.sub(k).add(penalty));
    }

    /*
        The same with integration expression above, we have:
        i*deltaB = (Q2-Q1)*(1-k+kQ0^2/Q1/Q2)
        Given Q1 and deltaB, solve Q2
        This is a quadratic function and the standard version is
        aQ2^2 + bQ2 + c = 0, where
        a=1-k
        -b=(1-k)Q1-kQ0^2/Q1+i*deltaB
        c=-kQ0^2
        and Q2=(-b+sqrt(b^2+4(1-k)kQ0^2))/2(1-k)
        note: another root is negative, abondan
        if deltaBSig=true, then Q2>Q1
        if deltaBSig=false, then Q2<Q1
    */
    function _SolveQuadraticFunctionForTrade(
        uint256 Q0,
        uint256 Q1,
        uint256 ideltaB,
        bool deltaBSig,
        uint256 k
    ) internal pure returns (uint256) {
        // calculate -b value and sig
        // -b = (1-k)Q1-kQ0^2/Q1+i*deltaB
        uint256 kQ02Q1 = DecimalMath.mul(k, Q0).mul(Q0).div(Q1); // kQ0^2/Q1
        uint256 b = DecimalMath.mul(ONE.sub(k), Q1); // (1-k)Q1
        bool minusbSig = true;
        if (deltaBSig) {
            b = b.add(ideltaB); // (1-k)Q1+i*deltaB
        } else {
            kQ02Q1 = kQ02Q1.add(ideltaB); // i*deltaB+kQ0^2/Q1
        }
        if (b >= kQ02Q1) {
            b = b.sub(kQ02Q1);
            minusbSig = true;
        } else {
            b = kQ02Q1.sub(b);
            minusbSig = false;
        }

        // calculate sqrt
        uint256 squareRoot = DecimalMath.mul(
            ONE.sub(k).mul(4),
            DecimalMath.mul(k, Q0).mul(Q0)
        ); // 4(1-k)kQ0^2
        squareRoot = b.mul(b).add(squareRoot).sqrt(); // sqrt(b*b+4(1-k)kQ0*Q0)

        // final res
        uint256 denominator = ONE.sub(k).mul(2); // 2(1-k)
        uint256 numerator;
        if (minusbSig) {
            numerator = b.add(squareRoot);
        } else {
            numerator = squareRoot.sub(b);
        }

        if (deltaBSig) {
            return DecimalMath.divFloor(numerator, denominator);
        } else {
            return DecimalMath.divCeil(numerator, denominator);
        }
    }

    /*
        Start from the integration function
        i*deltaB = (Q2-Q1)*(1-k+kQ0^2/Q1/Q2)
        Assume Q2=Q0, Given Q1 and deltaB, solve Q0
        let fairAmount = i*deltaB
    */
    function _SolveQuadraticFunctionForTarget(
        uint256 V1,
        uint256 k,
        uint256 fairAmount
    ) internal pure returns (uint256 V0) {
        // V0 = V1+V1*(sqrt-1)/2k
        uint256 sqrt = DecimalMath.divCeil(DecimalMath.mul(k, fairAmount).mul(4), V1);
        sqrt = sqrt.add(ONE).mul(ONE).sqrt();
        uint256 premium = DecimalMath.divCeil(sqrt.sub(ONE), k.mul(2));
        // V0 is greater than or equal to V1 according to the solution
        return DecimalMath.mul(V1, ONE.add(premium));
    }
}

interface IDODO {


    function _R_STATUS_() external view returns (uint8);
    function _QUOTE_BALANCE_() external view returns (uint256);
    function _BASE_BALANCE_() external view returns (uint256);
    function _K_() external view returns (uint256);
    function _MT_FEE_RATE_() external view returns (uint256);
    function _LP_FEE_RATE_() external view returns (uint256);

    function getExpectedTarget() external view returns (uint256 baseTarget, uint256 quoteTarget);
    function getOraclePrice() external view returns (uint256);
    function querySellBaseToken(uint256 sellAmount) external view returns (uint256);

}

contract DODOHelper {

    using SafeMath for uint256;

    enum RStatus {ONE, ABOVE_ONE, BELOW_ONE}

    uint256 constant ONE = 10**18;

    struct DODOState {
        uint256 oraclePrice;
        uint256 K;
        uint256 B;
        uint256 Q;
        uint256 baseTarget;
        uint256 quoteTarget;
        RStatus rStatus;
    }

    function querySellBaseToken(address dodo, uint256 amount) public view returns (uint256)
    {
        return IDODO(dodo).querySellBaseToken(amount);
    }

    function querySellQuoteToken(address dodo, uint256 amount) public view returns (uint256)
    {
        DODOState memory state;
        (state.baseTarget, state.quoteTarget) = IDODO(dodo).getExpectedTarget();
        state.rStatus = RStatus(IDODO(dodo)._R_STATUS_());
        state.oraclePrice = IDODO(dodo).getOraclePrice();
        state.Q = IDODO(dodo)._QUOTE_BALANCE_();
        state.B = IDODO(dodo)._BASE_BALANCE_();
        state.K = IDODO(dodo)._K_();

        uint256 boughtAmount;
        // Determine the status (RStatus) and calculate the amount
        // based on the state
        if (state.rStatus == RStatus.ONE) {
            boughtAmount = _ROneSellQuoteToken(amount, state);
        } else if (state.rStatus == RStatus.ABOVE_ONE) {
            boughtAmount = _RAboveSellQuoteToken(amount, state);
        } else {
            uint256 backOneBase = state.B.sub(state.baseTarget);
            uint256 backOneQuote = state.quoteTarget.sub(state.Q);
            if (amount <= backOneQuote) {
                boughtAmount = _RBelowSellQuoteToken(amount, state);
            } else {
                boughtAmount = backOneBase.add(
                    _ROneSellQuoteToken(amount.sub(backOneQuote), state));
            }
        }
        // Calculate fees
        uint256 mtFee = DecimalMath.mul(boughtAmount, IDODO(dodo)._MT_FEE_RATE_());
        uint256 lpFee = DecimalMath.mul(boughtAmount, IDODO(dodo)._LP_FEE_RATE_());
        return boughtAmount.sub(lpFee).sub(mtFee);
    }

    function _ROneSellQuoteToken(uint256 amount, DODOState memory state)
        internal
        view
        returns (uint256 receiveBaseToken)
    {
        uint256 i = DecimalMath.divFloor(ONE, state.oraclePrice);
        uint256 B2 = DODOMath._SolveQuadraticFunctionForTrade(
            state.baseTarget,
            state.baseTarget,
            DecimalMath.mul(i, amount),
            false,
            state.K
        );
        return state.baseTarget.sub(B2);
    }

    function _RAboveSellQuoteToken(
        uint256 amount,
        DODOState memory state
    )
        internal
        view
        returns (uint256 receieBaseToken)
    {
        uint256 i = DecimalMath.divFloor(ONE, state.oraclePrice);
        uint256 B2 = DODOMath._SolveQuadraticFunctionForTrade(
            state.baseTarget,
            state.B,
            DecimalMath.mul(i, amount),
            false,
            state.K
        );
        return state.B.sub(B2);
    }

    function _RBelowSellQuoteToken(
        uint256 amount,
        DODOState memory state
    )
        internal
        view
        returns (uint256 receiveBaseToken)
    {
        uint256 Q1 = state.Q.add(amount);
        return _RAboveIntegrate(state.quoteTarget, Q1, state.Q, state);
    }

    function _RAboveIntegrate(
        uint256 B0,
        uint256 B1,
        uint256 B2,
        DODOState memory state
    )
        internal
        view
        returns (uint256)
    {
        return DODOMath._GeneralIntegrate(B0, B1, B2, state.oraclePrice, state.K);
    }
}
